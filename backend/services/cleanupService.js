const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cron = require('node-cron');

const dbPath = path.join(__dirname, '../db/database.sqlite');

const purgeOldRecords = () => {
  return new Promise((resolve, reject) => {
    console.log('[CleanupService] Starting cleanup process...');
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('[CleanupService] Error connecting to database:', err.message);
        // Reject the promise if the connection fails
        return reject(new Error(`Database connection error: ${err.message}`));
      }
      console.log('[CleanupService] Connected to database for cleanup.');
    });

    // Promisify db methods for use with async/await
    const dbRun = (sql, params = []) => new Promise((res, rej) => {
      db.run(sql, params, function (err) {
        if (err) {
          console.error(`[CleanupService] Error running SQL: ${sql}`, err.message);
          rej(err);
        } else {
          res(this);
        }
      });
    });

    const dbAll = (sql, params = []) => new Promise((res, rej) => {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error(`[CleanupService] Error running SQL: ${sql}`, err.message);
          rej(err);
        } else {
          res(rows);
        }
      });
    });

    (async () => {
      try {
        // 1. Delete expired vpn_account records
        const expiredAccounts = await dbAll(`SELECT id, username, expired_date FROM vpn_account WHERE expired_date < datetime('now') AND expired_date IS NOT NULL`);
        if (expiredAccounts.length > 0) {
          console.log(`[CleanupService] Found ${expiredAccounts.length} expired accounts to delete:`);
          expiredAccounts.forEach(row => {
            console.log(`  - Account ID: ${row.id}, Username: ${row.username}, Expired: ${row.expired_date}`);
          });
          const { changes } = await dbRun(`DELETE FROM vpn_account WHERE expired_date < datetime('now') AND expired_date IS NOT NULL`);
          console.log(`[CleanupService] Successfully deleted ${changes} expired vpn_account records.`);
        } else {
          console.log('[CleanupService] No expired vpn_account records found to delete.');
        }

        // 2. Delete balance_transactions records older than 90 days
        const { changes: balanceChanges } = await dbRun(`DELETE FROM balance_transactions WHERE created_at < datetime('now', '-90 days') AND created_at IS NOT NULL`);
        if (balanceChanges > 0) {
          console.log(`[CleanupService] Successfully deleted ${balanceChanges} old balance_transactions records.`);
        } else {
          console.log('[CleanupService] No old balance_transactions found to delete.');
        }

        // 3. Delete topup_transactions records older than 90 days
        const { changes: topupChanges } = await dbRun(`DELETE FROM topup_transactions WHERE created_at < datetime('now', '-90 days') AND created_at IS NOT NULL`);
        if (topupChanges > 0) {
          console.log(`[CleanupService] Successfully deleted ${topupChanges} old topup_transactions records.`);
        } else {
          console.log('[CleanupService] No old topup_transactions found to delete.');
        }

        // 4. Run VACUUM to optimize database
        console.log('[CleanupService] Running VACUUM to optimize database...');
        await dbRun('VACUUM');
        console.log('[CleanupService] VACUUM completed successfully. Database optimized.');

        // Resolve the promise on success
        resolve({ message: "Cleanup completed successfully." });
      } catch (error) {
        console.error('[CleanupService] An error occurred during the cleanup process:', error.message);
        // Reject the promise on failure
        reject(error);
      } finally {
        // Always close the database connection
        db.close((err) => {
          if (err) {
            console.error('[CleanupService] Error closing database connection:', err.message);
          } else {
            console.log('[CleanupService] Database connection closed.');
          }
        });
      }
    })();
  });
};


const startCleanupScheduler = () => {
  // Schedule to run once a day at 3:00 AM
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
