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
    // 1. Delete expired vpn_account records with strict validation
    // First, check which accounts will be deleted for logging
    const checkExpiredSql = `SELECT id, username, expired_date FROM vpn_account WHERE expired_date < datetime('now') AND expired_date IS NOT NULL`;
    db.all(checkExpiredSql, [], (err, rows) => {
      if (err) {
        console.error('[CleanupService] Error checking expired accounts:', err.message);
      } else if (rows.length > 0) {
        console.log(`[CleanupService] Found ${rows.length} expired accounts to delete:`);
        rows.forEach(row => {
          console.log(`  - Account ID: ${row.id}, Username: ${row.username}, Expired: ${row.expired_date}`);
        });
        
        // Now delete with strict validation
        const deleteVpnSql = `DELETE FROM vpn_account WHERE expired_date < datetime('now') AND expired_date IS NOT NULL`;
        db.run(deleteVpnSql, function(err) {
          if (err) {
            console.error('[CleanupService] Error deleting expired vpn_account records:', err.message);
          } else {
            console.log(`[CleanupService] Successfully deleted ${this.changes} expired vpn_account records.`);
          }
        });
      } else {
        console.log('[CleanupService] No expired vpn_account records found to delete.');
      }
    });

    // 2. Delete balance_transactions records older than 90 days with validation
    const checkOldTransactionsSql = `SELECT COUNT(*) as count FROM balance_transactions WHERE created_at < datetime('now', '-90 days') AND created_at IS NOT NULL`;
    db.get(checkOldTransactionsSql, [], (err, row) => {
      if (err) {
        console.error('[CleanupService] Error checking old balance_transactions:', err.message);
      } else if (row.count > 0) {
        console.log(`[CleanupService] Found ${row.count} old balance_transactions to delete.`);
        
        const deleteTransactionsSql = `DELETE FROM balance_transactions WHERE created_at < datetime('now', '-90 days') AND created_at IS NOT NULL`;
        db.run(deleteTransactionsSql, [], function(err) {
          if (err) {
            console.error('[CleanupService] Error deleting old balance_transactions:', err.message);
          } else {
            console.log(`[CleanupService] Successfully deleted ${this.changes} old balance_transactions records.`);
          }
        });
      } else {
        console.log('[CleanupService] No old balance_transactions found to delete.');
      }
    });

    // 3. Delete topup_transactions records older than 90 days with validation
    const checkOldTopupSql = `SELECT COUNT(*) as count FROM topup_transactions WHERE created_at < datetime('now', '-90 days') AND created_at IS NOT NULL`;
    db.get(checkOldTopupSql, [], (err, row) => {
      if (err) {
        console.error('[CleanupService] Error checking old topup_transactions:', err.message);
      } else if (row.count > 0) {
        console.log(`[CleanupService] Found ${row.count} old topup_transactions to delete.`);
        
        const deleteTopupSql = `DELETE FROM topup_transactions WHERE created_at < datetime('now', '-90 days') AND created_at IS NOT NULL`;
        db.run(deleteTopupSql, [], function(err) {
          if (err) {
            console.error('[CleanupService] Error deleting old topup_transactions:', err.message);
          } else {
            console.log(`[CleanupService] Successfully deleted ${this.changes} old topup_transactions records.`);
          }
        });
      } else {
        console.log('[CleanupService] No old topup_transactions found to delete.');
      }
    });

    // 4. Run VACUUM to optimize database file size after cleanup
    setTimeout(() => {
      console.log('[CleanupService] Running VACUUM to optimize database...');
      db.run('VACUUM', function(err) {
        if (err) {
          console.error('[CleanupService] Error running VACUUM:', err.message);
        } else {
          console.log('[CleanupService] VACUUM completed successfully. Database optimized.');
        }
      });
    }, 5000); // Wait 5 seconds for all deletions to complete
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
