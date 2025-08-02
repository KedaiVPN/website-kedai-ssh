
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/database.sqlite');

class CleanupService {
  static async cleanupExpiredAccounts() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Cleanup: Database connection error:', err);
          return reject(err);
        }
      });

      // Delete expired accounts
      const deleteQuery = `
        DELETE FROM vpn_account 
        WHERE expired_date IS NOT NULL 
        AND DATE(expired_date) < DATE('now')
      `;

      db.run(deleteQuery, function(err) {
        if (err) {
          console.error('Cleanup: Error deleting expired accounts:', err);
          db.close();
          return reject(err);
        }

        const deletedCount = this.changes;
        console.log(`Cleanup: Deleted ${deletedCount} expired VPN accounts`);

        db.close((err) => {
          if (err) {
            console.error('Cleanup: Error closing database:', err);
            return reject(err);
          }
          resolve(deletedCount);
        });
      });
    });
  }

  static startCleanupScheduler() {
    // Run cleanup every hour
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds
    
    console.log('Starting cleanup scheduler...');
    
    // Run immediately on start
    this.cleanupExpiredAccounts()
      .then(count => console.log(`Initial cleanup: removed ${count} expired accounts`))
      .catch(err => console.error('Initial cleanup failed:', err));

    // Then run periodically
    setInterval(async () => {
      try {
        const count = await this.cleanupExpiredAccounts();
        if (count > 0) {
          console.log(`Scheduled cleanup: removed ${count} expired accounts`);
        }
      } catch (err) {
        console.error('Scheduled cleanup failed:', err);
      }
    }, CLEANUP_INTERVAL);
  }
}

module.exports = CleanupService;
