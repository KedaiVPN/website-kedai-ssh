const pool = require('../db/connection');
const cron = require('node-cron');

const purgeOldRecords = async () => {
  console.log('[CleanupService] Starting cleanup process...');
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('[CleanupService] Connected to database for cleanup.');

    // 1. Delete expired vpn_account records
    const [expiredAccounts] = await connection.query(`SELECT id, username, expired_date FROM vpn_account WHERE expired_date < NOW() AND expired_date IS NOT NULL`);
    if (expiredAccounts.length > 0) {
      console.log(`[CleanupService] Found ${expiredAccounts.length} expired accounts to delete.`);
      const [result] = await connection.query(`DELETE FROM vpn_account WHERE expired_date < NOW() AND expired_date IS NOT NULL`);
      console.log(`[CleanupService] Successfully deleted ${result.affectedRows} expired vpn_account records.`);
    } else {
      console.log('[CleanupService] No expired vpn_account records found to delete.');
    }

    // 2. Delete balance_transactions records older than 90 days
    const [balanceResult] = await connection.query(`DELETE FROM balance_transactions WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY) AND created_at IS NOT NULL`);
    if (balanceResult.affectedRows > 0) {
      console.log(`[CleanupService] Successfully deleted ${balanceResult.affectedRows} old balance_transactions records.`);
    } else {
      console.log('[CleanupService] No old balance_transactions found to delete.');
    }

    // 3. Delete topup_transactions records older than 90 days
    const [topupResult] = await connection.query(`DELETE FROM topup_transactions WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY) AND created_at IS NOT NULL`);
    if (topupResult.affectedRows > 0) {
      console.log(`[CleanupService] Successfully deleted ${topupResult.affectedRows} old topup_transactions records.`);
    } else {
      console.log('[CleanupService] No old topup_transactions found to delete.');
    }

    console.log('[CleanupService] Cleanup completed successfully.');
    return { message: "Cleanup completed successfully." };
  } catch (error) {
    console.error('[CleanupService] An error occurred during the cleanup process:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('[CleanupService] Database connection released.');
    }
  }
};

const startCleanupScheduler = () => {
  cron.schedule('0 3 * * *', async () => {
    console.log('[CleanupService] Running scheduled cleanup job...');
    try {
      await purgeOldRecords();
      console.log('[CleanupService] Scheduled cleanup job finished successfully.');
    } catch (error) {
      console.error('[CleanupService] Scheduled cleanup job failed:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta"
  });

  console.log('[CleanupService] Cleanup job scheduled to run daily at 3:00 AM (Asia/Jakarta).');
};

module.exports = {
  purgeOldRecords,
  startCleanupScheduler,
};
