const pool = require('../db/connection');
const cron = require('node-cron');

const purgeOldRecords = async () => {
  console.log('[CleanupService] Starting cleanup process...');
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    let totalDeleted = 0;

    // 1. Delete expired vpn_account records
    const [expiredAccounts] = await connection.execute(`SELECT id FROM vpn_account WHERE expired_date < NOW()`);
    if (expiredAccounts.length > 0) {
      const [result] = await connection.execute(`DELETE FROM vpn_account WHERE expired_date < NOW()`);
      console.log(`[CleanupService] Successfully deleted ${result.affectedRows} expired vpn_account records.`);
      totalDeleted += result.affectedRows;
    } else {
      console.log('[CleanupService] No expired vpn_account records found.');
    }

    // 2. Delete balance_transactions records older than 90 days
    const [balanceResult] = await connection.execute(`DELETE FROM balance_transactions WHERE created_at < NOW() - INTERVAL 90 DAY`);
    if (balanceResult.affectedRows > 0) {
      console.log(`[CleanupService] Successfully deleted ${balanceResult.affectedRows} old balance_transactions records.`);
      totalDeleted += balanceResult.affectedRows;
    }

    // 3. Delete topup_transactions records older than 90 days
    const [topupResult] = await connection.execute(`DELETE FROM topup_transactions WHERE created_at < NOW() - INTERVAL 90 DAY`);
    if (topupResult.affectedRows > 0) {
      console.log(`[CleanupService] Successfully deleted ${topupResult.affectedRows} old topup_transactions records.`);
      totalDeleted += topupResult.affectedRows;
    }

    await connection.commit();
    console.log(`[CleanupService] Total records deleted: ${totalDeleted}`);

    // 4. Run OPTIMIZE on tables if records were deleted
    if (totalDeleted > 0) {
      console.log('[CleanupService] Optimizing tables...');
      await pool.query('OPTIMIZE TABLE vpn_account, balance_transactions, topup_transactions');
      console.log('[CleanupService] Tables optimized successfully.');
    }

    return { message: "Cleanup completed successfully.", totalDeleted };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[CleanupService] An error occurred during the cleanup process:', error.message);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};

const startCleanupScheduler = () => {
  // Schedule to run once a day at 3:00 AM Asia/Jakarta
  cron.schedule('0 3 * * *', async () => {
    console.log('[CleanupService] Running scheduled cleanup job...');
    try {
      const result = await purgeOldRecords();
      console.log(`[CleanupService] Scheduled cleanup job finished successfully. Deleted ${result.totalDeleted} records.`);
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
