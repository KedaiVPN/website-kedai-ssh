const pool = require('../db/connection');
const xlService = require('./xlService');
const TelegramService = require('./telegramService');

const telegramService = new TelegramService();

const checkPendingTransactions = async () => {
  try {
    // Cari semua transaksi xl yang pending dan punya trx_id (berarti sudah hit API purchase dan tinggal nunggu status)
    // Dan yang payment_method = 'saldo' (karena yang di hold balance nya adalah yg resmi)
    // Kita cek semua yg status pending dan dibuat dalam 1 jam terakhir.
    const [pendingTransactions] = await pool.query(
      "SELECT * FROM xl_transactions WHERE status = 'pending' AND payment_method = 'saldo' AND trx_id IS NOT NULL AND created_at >= NOW() - INTERVAL 1 HOUR"
    );

    if (pendingTransactions.length === 0) {
      return;
    }

    for (const trx of pendingTransactions) {
      try {
        const result = await xlService.checkTransactionStatus(trx.trx_id);

        if (!result) {
          continue;
        }

        let apiStatus;

        if (result.status === false) {
          // Jika message mengandung "tidak valid" atau semacamnya, mungkin TRX benar-benar gagal
          if (result.message && result.message.toLowerCase().includes("tidak valid")) {
            console.log(`[XL Transaction Checker] Menganggap TRX ${trx.trx_id} sebagai gagal karena tidak valid.`);
            apiStatus = 0; // Set ke gagal
          } else {
            continue; // Akan dicek lagi di loop selanjutnya
          }
        } else {
          const statusData = result.data;
          apiStatus = statusData && statusData.status !== undefined ? Number(statusData.status) : null;
        }

        if (apiStatus === 1) { // Sukses
          // Update status transaksi jadi sukses
          await pool.query(
            "UPDATE xl_transactions SET status = 'success' WHERE id = ?",
            [trx.id]
          );

          // Jika ini terkait dengan scheduled purchase, update statusnya
          await pool.query(
            "UPDATE xl_scheduled_purchases SET status = 'completed' WHERE user_id = ? AND phone_number = ? AND package_code = ? AND status != 'completed'",
            [trx.user_id, trx.phone, trx.package_code]
          );

          console.log(`[XL Transaction Checker] TRX ${trx.trx_id} SUKSES. Saldo yang di-hold sudah terpotong (tidak direfund).`);

          // Kirim notif
          try {
            // Ambil data user
            const [userRows] = await pool.query('SELECT username, role FROM users WHERE id = ?', [trx.user_id]);
            if (userRows.length > 0) {
               telegramService.sendXLPurchaseNotification({
                packageName: trx.package_name,
                username: userRows[0].username,
                role: userRows[0].role,
                phoneNumber: trx.phone
              }).catch(e => console.log('Telegram error:', e.message));
            }
          } catch(e) {}

        } else if (apiStatus === 0) { // Gagal
          // Kembalikan saldo yang di-hold
          const connection = await pool.getConnection();
          try {
            await connection.beginTransaction();

            // Refund saldo
            const [userBefore] = await connection.query('SELECT balance FROM users WHERE id = ?', [trx.user_id]);
            const balanceBefore = userBefore[0].balance;

            await connection.query(
              'UPDATE users SET balance = balance + ? WHERE id = ?',
              [trx.fee, trx.user_id]
            );

            const balanceAfter = balanceBefore + trx.fee;

            // Catat transaksi refund
            await connection.query(
              `INSERT INTO balance_transactions
               (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after)
               VALUES (?, 'credit', ?, ?, 'xl_refund', ?, ?, ?)`,
              [
                trx.user_id,
                trx.fee,
                `Refund pembelian paket XL: ${trx.package_name} (TRX ID: ${trx.trx_id})`,
                trx.id,
                balanceBefore,
                balanceAfter
              ]
            );

            // Update status transaksi
            await connection.query(
              "UPDATE xl_transactions SET status = 'failed' WHERE id = ?",
              [trx.id]
            );

            // Update scheduled purchase jika ada
            await connection.query(
              "UPDATE xl_scheduled_purchases SET status = 'failed' WHERE user_id = ? AND phone_number = ? AND package_code = ? AND status != 'failed'",
              [trx.user_id, trx.phone, trx.package_code]
            );

            await connection.commit();
            console.log(`[XL Transaction Checker] TRX ${trx.trx_id} GAGAL. Saldo ${trx.fee} telah direfund ke user ${trx.user_id}.`);

          } catch (refundError) {
            await connection.rollback();
            console.error(`[XL Transaction Checker] Gagal melakukan refund untuk TRX ${trx.trx_id}:`, refundError);
          } finally {
            connection.release();
          }
        }
        // Jika apiStatus === 2 (Pending), maka biarkan dan akan dicek lagi 5 detik kemudian

      } catch (err) {
        console.error(`[XL Transaction Checker] Error processing TRX ${trx.trx_id}:`, err.message);
      }
    }
  } catch (error) {
    console.error('[XL Transaction Checker] Error in checking pending transactions:', error.message);
  }
};

const startTransactionChecker = () => {
  console.log('🕒 XL Transaction Checker started (checking every 5 seconds)...');
  setInterval(checkPendingTransactions, 5000); // 5 detik
};

module.exports = {
  startTransactionChecker,
  checkPendingTransactions
};
