const pool = require('../db/connection');
const cron = require('node-cron');

const demoteInactiveResellers = async (connection) => {
  console.log('[CleanupService] Starting reseller demotion check...');
  try {
    // Get all resellers to check their status
    const [resellers] = await connection.query("SELECT id, username, reseller_since FROM users WHERE role = 'reseller'");
    if (resellers.length === 0) {
      console.log('[CleanupService] No resellers found.');
      return;
    }

    console.log(`[CleanupService] Found ${resellers.length} resellers to process.`);

    for (const reseller of resellers) {
      // Handle existing resellers who don't have a `reseller_since` date yet
      if (!reseller.reseller_since) {
        await connection.query("UPDATE users SET reseller_since = NOW() WHERE id = ?", [reseller.id]);
        console.log(`[CleanupService] Initialized grace period for existing reseller ${reseller.username} (ID: ${reseller.id}).`);
        continue; // Skip check for this cycle
      }

      // Check if the reseller is still within their 30-day grace period
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const resellerSinceDate = new Date(reseller.reseller_since);

      if (resellerSinceDate > thirtyDaysAgo) {
        console.log(`[CleanupService] Reseller ${reseller.username} (ID: ${reseller.id}) is still within grace period.`);
        continue; // Skip check
      }
      // Count accounts created in the last 30 days
      const [result] = await connection.query(
        "SELECT COUNT(id) as accountCount FROM vpn_account WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)",
        [reseller.id]
      );

      const accountCount = result[0].accountCount;
      console.log(`[CleanupService] Reseller ${reseller.username} (ID: ${reseller.id}) created ${accountCount} accounts in the last 30 days.`);

      if (accountCount < 5) {
        // Demote user to member and reset reseller_since timestamp
        const [updateResult] = await connection.query("UPDATE users SET role = 'member', reseller_since = NULL WHERE id = ?", [reseller.id]);
        if (updateResult.affectedRows > 0) {
            console.log(`[CleanupService] SUCCESS: Demoted reseller ${reseller.username} (ID: ${reseller.id}) to 'member' due to inactivity.`);
        } else {
            console.log(`[CleanupService] INFO: Reseller ${reseller.username} (ID: ${reseller.id}) was already a member or could not be updated.`);
        }
      }
    }
    console.log('[CleanupService] Reseller demotion check finished.');
  } catch (error) {
    console.error('[CleanupService] An error occurred during reseller demotion check:', error.message);
    // Do not rethrow, as we want the rest of the cleanup to proceed.
  }
};

const purgeOldRecords = async () => {
  console.log('[CleanupService] Starting cleanup process...');
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('[CleanupService] Connected to database for cleanup.');

    // 1. Demote inactive resellers
    await demoteInactiveResellers(connection);

    // 2. Delete expired vpn_account records
    const [expiredAccounts] = await connection.query(`SELECT id, username, expired_date FROM vpn_account WHERE expired_date < NOW() AND expired_date IS NOT NULL`);
    if (expiredAccounts.length > 0) {
      console.log(`[CleanupService] Found ${expiredAccounts.length} expired accounts to delete.`);
      const [result] = await connection.query(`DELETE FROM vpn_account WHERE expired_date < NOW() AND expired_date IS NOT NULL`);
      console.log(`[CleanupService] Successfully deleted ${result.affectedRows} expired vpn_account records.`);
    } else {
      console.log('[CleanupService] No expired vpn_account records found to delete.');
    }

    // 3. Delete balance_transactions records older than 90 days
    const [balanceResult] = await connection.query(`DELETE FROM balance_transactions WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY) AND created_at IS NOT NULL`);
    if (balanceResult.affectedRows > 0) {
      console.log(`[CleanupService] Successfully deleted ${balanceResult.affectedRows} old balance_transactions records.`);
    } else {
      console.log('[CleanupService] No old balance_transactions found to delete.');
    }

    // 4. Delete topup_transactions records older than 90 days
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
