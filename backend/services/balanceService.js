
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/database.sqlite');

class BalanceService {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
  }

  // Get pricing from database based on IP limit
  async getPriceByIPLimit(ipLimit) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT price_per_day FROM pricing_config WHERE ip_limit = ?',
        [ipLimit],
        (err, row) => {
          if (err) {
            console.error('Error getting price:', err);
            reject(err);
          } else if (row) {
            resolve(row.price_per_day);
          } else {
            // Default fallback pricing if not found in database
            const defaultPricing = { 1: 330, 2: 430, 4: 600 };
            resolve(defaultPricing[ipLimit] || 330);
          }
        }
      );
    });
  }

  // Calculate total account cost
  async calculateAccountCost(ipLimit, duration) {
    try {
      const dailyPrice = await this.getPriceByIPLimit(ipLimit);
      return dailyPrice * duration;
    } catch (error) {
      console.error('Error calculating account cost:', error);
      throw error;
    }
  }

  // Get user balance
  async getUserBalance(userId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT balance FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) {
            console.error('Error getting user balance:', err);
            reject(err);
          } else {
            resolve(row ? row.balance : 0);
          }
        }
      );
    });
  }

  // Validate if user has sufficient balance
  async validateSufficientBalance(userId, requiredAmount) {
    try {
      const currentBalance = await this.getUserBalance(userId);
      return currentBalance >= requiredAmount;
    } catch (error) {
      console.error('Error validating balance:', error);
      return false;
    }
  }

  // Deduct balance from user account
  async deductBalance(userId, amount, description, accountId = null) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Update user balance
        this.db.run(
          'UPDATE users SET balance = balance - ? WHERE id = ?',
          [amount, userId],
          function(err) {
            if (err) {
              this.db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Record transaction
            this.db.run(
              `INSERT INTO balance_transactions (user_id, type, amount, description, account_id) 
               VALUES (?, 'debit', ?, ?, ?)`,
              [userId, amount, description, accountId],
              function(err) {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                this.db.run('COMMIT');
                resolve({ success: true, transactionId: this.lastID });
              }
            );
          }
        );
      });
    });
  }

  // Add balance to user account (for top-up or refunds)
  async addBalance(userId, amount, description, accountId = null) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        // Update user balance
        this.db.run(
          'UPDATE users SET balance = balance + ? WHERE id = ?',
          [amount, userId],
          function(err) {
            if (err) {
              this.db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Record transaction
            this.db.run(
              `INSERT INTO balance_transactions (user_id, type, amount, description, account_id) 
               VALUES (?, 'credit', ?, ?, ?)`,
              [userId, amount, description, accountId],
              function(err) {
                if (err) {
                  this.db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                this.db.run('COMMIT');
                resolve({ success: true, transactionId: this.lastID });
              }
            );
          }
        );
      });
    });
  }

  // Get user transaction history
  async getTransactionHistory(userId, limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT bt.*, va.username as account_username, va.protocol 
         FROM balance_transactions bt 
         LEFT JOIN vpn_account va ON bt.account_id = va.id 
         WHERE bt.user_id = ? 
         ORDER BY bt.created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, rows) => {
          if (err) {
            console.error('Error getting transaction history:', err);
            reject(err);
          } else {
            resolve(rows || []);
          }
        }
      );
    });
  }
}

module.exports = new BalanceService();
