const cron = require('node-cron');
const pool = require('../db/connection');
const xlService = require('./xlService');
const TelegramService = require('./telegramService');

const telegramService = new TelegramService();

// Fungsi untuk mengeksekusi pembelian yang dijadwalkan
const executeScheduledPurchases = async () => {
    console.log('[Cron Job] Running scheduled purchase execution...');
    const connection = await pool.getConnection();

    try {
        const today = new Date().toISOString().slice(0, 10);
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
                    { ...schedule, name: schedule.package_name },
                    schedule.phone_number,
                    'official_purchase',
                    'BALANCE',
                    schedule.price
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

// Menjalankan cron job setiap hari jam 00:10
const startScheduledPurchaseCron = () => {
    cron.schedule('10 0 * * *', executeScheduledPurchases, {
        scheduled: true,
        timezone: "Asia/Jakarta"
    });
    console.log('🕒 XL Scheduled Purchase cron job is set to run every day at 00:10 AM Jakarta time.');
};

module.exports = { startScheduledPurchaseCron };
