const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cron = require('node-cron');

const dbPath = path.join(__dirname, '../db/database.sqlite');

const purgeOldRecords = () => {
  console.log('[CleanupService] Starting cleanup process...');
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[CleanupService] Error connecting to database:', err.message);
      return;
    }
    console.log('[CleanupService] Connected to database for cleanup.');
  });

  db.serialize(() => {
    // 1. Delete expired vpn_account records
    // Deletes accounts where the expiration date is in the past.
    const deleteVpnSql = `DELETE FROM vpn_account WHERE expired_date < datetime('now')`;
    db.run(deleteVpnSql, function(err) {
      if (err) {
        console.error('[CleanupService] Error deleting expired vpn_account records:', err.message);
      } else {
        console.log(`[CleanupService] Deleted ${this.changes} expired vpn_account records.`);
      }
    });

    // 2. Delete balance_transactions records older than 90 days
    const deleteTransactionsSql = `DELETE FROM balance_transactions WHERE created_at < datetime('now', '-90 days')`;
    db.run(deleteTransactionsSql, [], function(err) {
      if (err) {
        console.error('[CleanupService] Error deleting old balance_transactions:', err.message);
      } else {
        console.log(`[CleanupService] Deleted ${this.changes} old balance_transactions records.`);
      }
    });

    // 3. Delete topup_transactions records older than 90 days
    const deleteTopupSql = `DELETE FROM topup_transactions WHERE created_at < datetime('now', '-90 days')`;
    db.run(deleteTopupSql, [], function(err) {
      if (err) {
        console.error('[CleanupService] Error deleting old topup_transactions:', err.message);
      } else {
        console.log(`[CleanupService] Deleted ${this.changes} old topup_transactions records.`);
      }
    });
  });

  db.close((err) => {
    if (err) {
      console.error('[CleanupService] Error closing database connection:', err.message);
    } else {
      console.log('[CleanupService] Database connection closed.');
    }
  });
};

const startCleanupScheduler = () => {
  // Schedule to run once a day at 3:00 AM
  cron.schedule('0 3 * * *', () => {
    console.log('[CleanupService] Running scheduled cleanup job...');
    purgeOldRecords();
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
