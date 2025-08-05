
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/database.sqlite');

// Pricing constants - same as frontend
const PRICING_BY_IP_LIMIT = {
  1: 330,  // Rp330/hari
  2: 430,  // Rp430/hari
  4: 600   // Rp600/hari
};

class BalanceService {
  // Get daily price by IP limit
  static getPriceByIPLimit(ipLimit) {
    const price = PRICING_BY_IP_LIMIT[ipLimit];
    if (!price) {
      throw new Error(`Invalid IP limit: ${ipLimit}`);
    }
    return price;
  }

  // Calculate total account cost
  static calculateAccountCost(ipLimit, duration) {
    const dailyPrice = this.getPriceByIPLimit(ipLimit);
    return dailyPrice * duration;
  }

  // Get user balance
  static getUserBalance(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      
      db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('User not found'));
        } else {
          resolve(row.balance || 0);
        }
      });
    });
  }

  // Validate if user has sufficient balance
  static async validateSufficientBalance(userId, requiredAmount) {
    try {
      const currentBalance = await this.getUserBalance(userId);
      return {
        sufficient: currentBalance >= requiredAmount,
        currentBalance,
        requiredAmount,
        shortage: Math.max(0, requiredAmount - currentBalance)
      };
    } catch (error) {
      throw new Error(`Failed to validate balance: ${error.message}`);
    }
  }

  // Deduct balance from user account
  static deductBalance(userId, amount, description, referenceType = null, referenceId = null) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Get current balance
        db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
          if (err || !row) {
            db.run('ROLLBACK');
            db.close();
            return reject(new Error('User not found or database error'));
          }

          const balanceBefore = row.balance || 0;
          const balanceAfter = balanceBefore - amount;

          if (balanceAfter < 0) {
            db.run('ROLLBACK');
            db.close();
            return reject(new Error('Insufficient balance'));
          }

          // Update user balance
          db.run('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              db.close();
              return reject(new Error('Failed to update balance'));
            }

            // Record transaction
            db.run(`
              INSERT INTO balance_transactions 
              (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after)
              VALUES (?, 'debit', ?, ?, ?, ?, ?, ?)
            `, [userId, amount, description, referenceType, referenceId, balanceBefore, balanceAfter], (err) => {
              if (err) {
                db.run('ROLLBACK');
                db.close();
                return reject(new Error('Failed to record transaction'));
              }

              db.run('COMMIT');
              db.close();
              resolve({
                success: true,
                balanceBefore,
                balanceAfter,
                amount,
                description
              });
            });
          });
        });
      });
    });
  }

  // Add balance to user account (for future top-up feature)
  static addBalance(userId, amount, description, referenceType = null, referenceId = null) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Get current balance
        db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
          if (err || !row) {
            db.run('ROLLBACK');
            db.close();
            return reject(new Error('User not found or database error'));
          }

          const balanceBefore = row.balance || 0;
          const balanceAfter = balanceBefore + amount;

          // Update user balance
          db.run('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              db.close();
              return reject(new Error('Failed to update balance'));
            }

            // Record transaction
            db.run(`
              INSERT INTO balance_transactions 
              (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after)
              VALUES (?, 'credit', ?, ?, ?, ?, ?, ?)
            `, [userId, amount, description, referenceType, referenceId, balanceBefore, balanceAfter], (err) => {
              if (err) {
                db.run('ROLLBACK');
                db.close();
                return reject(new Error('Failed to record transaction'));
              }

              db.run('COMMIT');
              db.close();
              resolve({
                success: true,
                balanceBefore,
                balanceAfter,
                amount,
                description
              });
            });
          });
        });
      });
    });
  }

  // Get balance transaction history
  static getTransactionHistory(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      
      db.all(`
        SELECT * FROM balance_transactions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [userId, limit], (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

module.exports = BalanceService;
