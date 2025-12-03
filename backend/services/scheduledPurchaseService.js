const cron = require('node-cron');
const pool = require('../db/connection');
const xlService = require('./xlService');
const TelegramService = require('./telegramService');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const telegramService = new TelegramService();

// Fungsi untuk mengeksekusi pembelian yang dijadwalkan
const executeScheduledPurchases = async () => {
    console.log('[Cron Job] Running scheduled purchase execution...');
    const connection = await pool.getConnection();

    try {
        // Use dayjs to get the current date in Asia/Jakarta timezone
        const today = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const [schedules] = await connection.query(
            `SELECT sp.id, sp.user_id, sp.phone_number, sp.package_code, u.username, u.balance, p.fee, p.name as package_name, p.price, p.kategori
             FROM xl_scheduled_purchases sp
             JOIN users u ON sp.user_id = u.id
             JOIN xl_packages p ON sp.package_code = p.package_code
             WHERE sp.scheduled_date = ? AND sp.status = 'active'`,
            [today]
        );

        if (schedules.length === 0) {
            console.log('[Cron Job] No scheduled purchases for today.');
            return;
        }

        console.log(`[Cron Job] Found ${schedules.length} purchases to process for today.`);

        for (const schedule of schedules) {
            let finalStatus;
            try {
                await connection.beginTransaction();

                // 1. Re-check balance at the time of execution
                const [currentUser] = await connection.query('SELECT balance FROM users WHERE id = ?', [schedule.user_id]);
                if (currentUser[0].balance < schedule.fee) {
                    throw new Error('Saldo tidak mencukupi saat eksekusi.');
                }

                // 2. Re-check package validity
                const [currentPackage] = await connection.query(
                    'SELECT price, is_active FROM xl_packages WHERE package_code = ?', [schedule.package_code]
                );
                if (!currentPackage[0] || !currentPackage[0].is_active) {
                    throw new Error('Paket sudah tidak aktif.');
                }
                if (currentPackage[0].price !== schedule.price) {
                     throw new Error('Harga paket telah berubah.');
                }

                // 3. Execute purchase via xlService
                const purchaseResult = await xlService.purchasePackage(
                    { ...schedule, name: schedule.package_name }, // packageData
                    schedule.phone_number,                        // phone
                    null,                                         // accessToken (not needed for official)
                    'BALANCE',                                    // paymentMethod
                    schedule.price                                // price_or_fee (using price for official)
                );

                if (!purchaseResult.status) {
                    throw new Error(purchaseResult.message || 'Pembelian gagal di API XL.');
                }

                // 4. Deduct balance and record transactions
                const balanceBefore = currentUser[0].balance;
                await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [schedule.fee, schedule.user_id]);
                const [balanceAfterResult] = await connection.query('SELECT balance FROM users WHERE id = ?', [schedule.user_id]);
                const balanceAfter = balanceAfterResult[0].balance;

                const [txResult] = await connection.query(
                  `INSERT INTO xl_transactions (user_id, package_code, package_name, phone, trx_id, payment_method, fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'success')`,
                  [schedule.user_id, schedule.package_code, schedule.package_name, schedule.phone_number, purchaseResult.data?.trx_id || null, 'saldo', schedule.fee]
                );

                await connection.query(
                  `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'debit', ?, ?, 'xl_transaction', ?, ?, ?)`,
                  [schedule.user_id, schedule.fee, `Pembelian terjadwal: ${schedule.package_name}`, txResult.insertId, balanceBefore, balanceAfter]
                );

                // Normal successful purchase notification will be sent by purchasePackage service
                await connection.commit();
                finalStatus = 'completed';
                console.log(`[Cron Job] SUCCESS: Schedule ID ${schedule.id} for user ${schedule.username} processed.`);

                // Send Telegram notification for successful scheduled purchase
                telegramService.sendScheduledXLPurchaseNotification({
                    packageName: schedule.package_name,
                    username: schedule.username,
                    phoneNumber: schedule.phone_number,
                    status: 'BERHASIL'
                }).catch(e => console.error('[Cron Job] Failed to send SUCCESS Telegram notification:', e.message));

            } catch (error) {
                await connection.rollback();
                finalStatus = 'failed';
                console.error(`[Cron Job] FAILED: Schedule ID ${schedule.id} for user ${schedule.username}. Reason: ${error.message}`);
            }

            // 5. Update schedule status
            await connection.query(
                "UPDATE xl_scheduled_purchases SET status = ? WHERE id = ?",
                [finalStatus, schedule.id]
            );
        }

    } catch (error) {
        console.error('[Cron Job] A critical error occurred during scheduled purchase execution:', error);
    } finally {
        connection.release();
    }
};

// Fungsi untuk mengulangi pembelian yang gagal
const retryFailedScheduledPurchases = async () => {
    console.log('[Cron Job] Running retry for failed scheduled purchases...');
    const connection = await pool.getConnection();

    try {
        const today = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');
        const [failedSchedules] = await connection.query(
            `SELECT sp.id, sp.user_id, sp.phone_number, sp.package_code, u.username, u.balance, p.fee, p.name as package_name, p.price, p.kategori
             FROM xl_scheduled_purchases sp
             JOIN users u ON sp.user_id = u.id
             JOIN xl_packages p ON sp.package_code = p.package_code
             WHERE sp.scheduled_date = ? AND sp.status = 'failed'`,
            [today]
        );

        if (failedSchedules.length === 0) {
            console.log('[Cron Job] No failed purchases to retry today.');
            return { retried: 0, success: 0, failed: 0 };
        }

        console.log(`[Cron Job] Found ${failedSchedules.length} failed purchases to retry.`);

        let successCount = 0;
        let failCount = 0;

        for (const schedule of failedSchedules) {
            let newStatus;
            try {
                await connection.beginTransaction();

                // 1. Re-check balance at the time of execution
                const [currentUser] = await connection.query('SELECT balance FROM users WHERE id = ?', [schedule.user_id]);
                if (currentUser[0].balance < schedule.fee) {
                    throw new Error('Saldo tidak mencukupi saat retry.');
                }

                // 2. Re-check package validity
                const [currentPackage] = await connection.query(
                    'SELECT price, is_active FROM xl_packages WHERE package_code = ?', [schedule.package_code]
                );
                if (!currentPackage[0] || !currentPackage[0].is_active) {
                    throw new Error('Paket sudah tidak aktif.');
                }

                // 3. Execute purchase via xlService
                const purchaseResult = await xlService.purchasePackage(
                    { ...schedule, name: schedule.package_name },
                    schedule.phone_number,
                    null,
                    'BALANCE',
                    currentPackage[0].price
                );

                if (!purchaseResult.status) {
                    throw new Error(purchaseResult.message || 'Pembelian gagal di API XL.');
                }

                // 4. Deduct balance and record transactions
                const balanceBefore = currentUser[0].balance;
                await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [schedule.fee, schedule.user_id]);
                const [balanceAfterResult] = await connection.query('SELECT balance FROM users WHERE id = ?', [schedule.user_id]);
                const balanceAfter = balanceAfterResult[0].balance;

                const [txResult] = await connection.query(
                    `INSERT INTO xl_transactions (user_id, package_code, package_name, phone, trx_id, payment_method, fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'success')`,
                    [schedule.user_id, schedule.package_code, schedule.package_name, schedule.phone_number, purchaseResult.data?.trx_id || null, 'saldo', schedule.fee]
                );

                await connection.query(
                    `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'debit', ?, ?, 'xl_transaction', ?, ?, ?)`,
                    [schedule.user_id, schedule.fee, `Pembelian terjadwal (retry): ${schedule.package_name}`, txResult.insertId, balanceBefore, balanceAfter]
                );

                await connection.commit();
                newStatus = 'completed';
                successCount++;
                console.log(`[Cron Job Retry] SUCCESS: Schedule ID ${schedule.id} for user ${schedule.username} retried successfully.`);

                // Send Telegram notification for successful retry
                telegramService.sendScheduledXLPurchaseNotification({
                    packageName: schedule.package_name,
                    username: schedule.username,
                    phoneNumber: schedule.phone_number,
                    status: 'BERHASIL (RETRY)'
                }).catch(e => console.error('[Cron Job Retry] Failed to send SUCCESS Telegram notification:', e.message));

            } catch (error) {
                await connection.rollback();
                newStatus = 'failed';
                failCount++;
                console.error(`[Cron Job Retry] FAILED: Schedule ID ${schedule.id} for user ${schedule.username}. Reason: ${error.message}`);
            }

            // Update schedule status
            await connection.query(
                "UPDATE xl_scheduled_purchases SET status = ? WHERE id = ?",
                [newStatus, schedule.id]
            );
        }

        console.log(`[Cron Job Retry] Summary: ${successCount} success, ${failCount} failed out of ${failedSchedules.length} retried.`);
        return { retried: failedSchedules.length, success: successCount, failed: failCount };

    } catch (error) {
        console.error('[Cron Job Retry] A critical error occurred during retry:', error);
        return { retried: 0, success: 0, failed: 0, error: error.message };
    } finally {
        connection.release();
    }
};

// Fungsi untuk retry manual satu jadwal tertentu
const retrySingleScheduledPurchase = async (scheduleId, userId) => {
    const connection = await pool.getConnection();

    try {
        const today = dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD');

        // Validasi: pastikan jadwal ini milik user, gagal, dan hari ini
        const [schedules] = await connection.query(
            `SELECT sp.*, p.fee, p.name as package_name, p.price, p.kategori, u.balance, u.username
             FROM xl_scheduled_purchases sp
             JOIN xl_packages p ON sp.package_code = p.package_code
             JOIN users u ON sp.user_id = u.id
             WHERE sp.id = ? AND sp.user_id = ? AND sp.status = 'failed' AND sp.scheduled_date = ?`,
            [scheduleId, userId, today]
        );

        if (!schedules[0]) {
            throw new Error('Jadwal tidak ditemukan, bukan milik Anda, atau tidak bisa di-retry (bukan jadwal hari ini yang gagal).');
        }

        const schedule = schedules[0];

        // Cek saldo
        if (schedule.balance < schedule.fee) {
            throw new Error('Saldo tidak mencukupi untuk retry. Fee: Rp' + schedule.fee.toLocaleString('id-ID'));
        }

        await connection.beginTransaction();

        // Execute purchase via xlService
        const purchaseResult = await xlService.purchasePackage(
            { ...schedule, name: schedule.package_name },
            schedule.phone_number,
            null,
            'BALANCE',
            schedule.price
        );

        if (!purchaseResult.status) {
            throw new Error(purchaseResult.message || 'Pembelian gagal di API XL.');
        }

        // Deduct balance and record transactions
        const balanceBefore = schedule.balance;
        await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [schedule.fee, userId]);
        const [balanceAfterResult] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
        const balanceAfter = balanceAfterResult[0].balance;

        const [txResult] = await connection.query(
            `INSERT INTO xl_transactions (user_id, package_code, package_name, phone, trx_id, payment_method, fee, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'success')`,
            [userId, schedule.package_code, schedule.package_name, schedule.phone_number, purchaseResult.data?.trx_id || null, 'saldo', schedule.fee]
        );

        await connection.query(
            `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'debit', ?, ?, 'xl_transaction', ?, ?, ?)`,
            [userId, schedule.fee, `Pembelian terjadwal (manual retry): ${schedule.package_name}`, txResult.insertId, balanceBefore, balanceAfter]
        );

        // Update schedule status
        await connection.query(
            "UPDATE xl_scheduled_purchases SET status = 'completed' WHERE id = ?",
            [scheduleId]
        );

        await connection.commit();

        // Send Telegram notification
        telegramService.sendScheduledXLPurchaseNotification({
            packageName: schedule.package_name,
            username: schedule.username,
            phoneNumber: schedule.phone_number,
            status: 'BERHASIL (MANUAL RETRY)'
        }).catch(e => console.error('[Manual Retry] Failed to send Telegram notification:', e.message));

        return {
            success: true,
            message: 'Pembelian berhasil diulangi!',
            data: {
                transactionId: txResult.insertId,
                remainingBalance: balanceAfter
            }
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

// Menjalankan cron jobs
const startScheduledPurchaseCron = () => {
    // Main execution: jam 00:10 untuk eksekusi utama
    cron.schedule('10 0 * * *', async () => {
        console.log('[Cron Job] Running scheduled purchase job at 00:10...');
        try {
            await executeScheduledPurchases();
            console.log('[Cron Job] Scheduled purchase job finished successfully.');
        } catch (error) {
            console.error('[Cron Job] Scheduled purchase job failed:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });

    // First retry: jam 01:00
    cron.schedule('0 1 * * *', async () => {
        console.log('[Cron Job] Running first retry at 01:00...');
        try {
            await retryFailedScheduledPurchases();
            console.log('[Cron Job] First retry finished.');
        } catch (error) {
            console.error('[Cron Job] First retry failed:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });

    // Second retry: jam 03:00
    cron.schedule('0 3 * * *', async () => {
        console.log('[Cron Job] Running second retry at 03:00...');
        try {
            await retryFailedScheduledPurchases();
            console.log('[Cron Job] Second retry finished.');
        } catch (error) {
            console.error('[Cron Job] Second retry failed:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });

    console.log('🕒 XL Scheduled Purchase cron jobs configured:');
    console.log('   - Main execution: 00:10 Jakarta');
    console.log('   - First retry: 01:00 Jakarta');
    console.log('   - Second retry: 03:00 Jakarta');
};

module.exports = { 
    startScheduledPurchaseCron, 
    retryFailedScheduledPurchases,
    retrySingleScheduledPurchase
};
