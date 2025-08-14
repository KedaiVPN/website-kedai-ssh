
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../db/database.sqlite');

class BalanceService {
  /**
   * Fetches the global pricing configuration from the database.
   * @returns {Promise<Object>} A promise that resolves to an object mapping ip_limit to daily_price.
   */
  static getGlobalPricingConfig() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      db.all('SELECT ip_limit, daily_price FROM pricing_config', [], (err, rows) => {
        db.close();
        if (err) {
          console.error('[BalanceService] Failed to load global pricing config:', err);
          return reject(new Error('Failed to load global pricing config'));
        }
        const config = rows.reduce((acc, row) => {
          acc[row.ip_limit] = row.daily_price;
          return acc;
        }, {});
        resolve(config);
      });
    });
  }

  /**
   * Calculates the daily price for a given IP limit and user role.
   * Prioritizes per-server pricing, then falls back to global pricing from the database.
   * @param {number} ipLimit - The IP limit (e.g., 1, 2, 4).
   * @param {string} userRole - The user's role ('member' or 'reseller').
   * @param {string|null} serverId - The ID of the server to check for specific pricing.
   * @returns {Promise<number>} A promise that resolves to the calculated daily price.
   */
  static async getDailyPrice(ipLimit, userRole = 'member', serverId = null) {
    // 1. Check for server-specific pricing first
    if (serverId) {
      const serverPrice = await new Promise((resolve) => {
        const db = new sqlite3.Database(dbPath);
        db.get(
          `SELECT member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip FROM server_pricing WHERE server_id = ?`,
          [serverId],
          (err, row) => {
            db.close();
            // If there's an error or no row, we'll fallback, so resolve null
            if (err || !row) {
              return resolve(null);
            }
            // The column name is constructed like 'member_1ip', 'reseller_2ip', etc.
            const key = `${userRole}_${ipLimit}ip`;
            const price = row[key];
            if (typeof price === 'number' && price > 0) {
              console.log(`[BalanceService] Using server-specific pricing for server ${serverId}: ${key} -> ${price}`);
              return resolve(price);
            }
            // If key doesn't exist or price is invalid, resolve null to trigger fallback
            resolve(null);
          }
        );
      });
      // If a valid server-specific price was found, return it immediately.
      if (serverPrice !== null) {
        return serverPrice;
      }
    }

    // 2. Fallback to global pricing from the database
    console.log(`[BalanceService] Using global pricing fallback (Server: ${serverId || 'None'})`);
    const globalPricing = await this.getGlobalPricingConfig();
    const basePrice = globalPricing[ipLimit];

    if (typeof basePrice !== 'number') {
      throw new Error(`Invalid or missing global price for IP limit: ${ipLimit}`);
    }

    // Apply reseller discount on the base global price
    if (userRole === 'reseller') {
      return Math.floor(basePrice * 0.5);
    }
    return basePrice;
  }

  // Calculate total account cost using per-server pricing when serverId is provided
  static async calculateServerAccountCost(ipLimit, duration, userRole = 'member', serverId = null) {
    const dailyPrice = await this.getDailyPrice(ipLimit, userRole, serverId);
    const totalCost = dailyPrice * duration;
    console.log(`[BalanceService] Cost calculation (server ${serverId || 'global'}): ${ipLimit} IP × ${duration} days × ${dailyPrice}/day = ${totalCost} (Role: ${userRole})`);
    return totalCost;
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

  // Get user role
  static getUserRole(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      
      db.get('SELECT role FROM users WHERE id = ?', [userId], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('User not found'));
        } else {
          resolve(row.role || 'member');
        }
      });
    });
  }

  // Validate if user has sufficient balance (with role consideration)
  static async validateSufficientBalance(userId, requiredAmount) {
    try {
      const currentBalance = await this.getUserBalance(userId);
      const sufficient = currentBalance >= requiredAmount;
      
      console.log(`[BalanceService] Balance validation - User: ${userId}, Required: ${requiredAmount}, Current: ${currentBalance}, Sufficient: ${sufficient}`);
      
      return {
        sufficient,
        currentBalance,
        requiredAmount,
        shortage: Math.max(0, requiredAmount - currentBalance)
      };
    } catch (error) {
      throw new Error(`Failed to validate balance: ${error.message}`);
    }
  }

  // Update user role to reseller if topup >= 25000
  static updateUserRoleBasedOnTopup(userId, topupAmount) {
    return new Promise((resolve, reject) => {
      if (topupAmount < 25000) {
        // No role update needed
        return resolve({ roleUpdated: false, newRole: 'member' });
      }

      const db = new sqlite3.Database(dbPath);
      
      // Check current role first
      db.get('SELECT role FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
          db.close();
          return reject(err);
        }

        if (!row) {
          db.close();
          return reject(new Error('User not found'));
        }

        const currentRole = row.role || 'member';
        
        // Only update if currently member and topup >= 25000
        if (currentRole === 'member' && topupAmount >= 25000) {
          db.run('UPDATE users SET role = ? WHERE id = ?', ['reseller', userId], (updateErr) => {
            db.close();
            if (updateErr) {
              return reject(updateErr);
            }
            console.log(`[BalanceService] Role upgraded: User ${userId} from ${currentRole} to reseller (topup: ${topupAmount})`);
            resolve({ roleUpdated: true, newRole: 'reseller', previousRole: currentRole });
          });
        } else {
          db.close();
          resolve({ roleUpdated: false, newRole: currentRole });
        }
      });
    });
  }

  // Deduct balance from user account - STRICT VERSION for account operations
  static deductBalance(userId, amount, description, referenceType = null, referenceId = null) {
    return new Promise((resolve, reject) => {
      // Input validation
      if (!userId || amount <= 0) {
        console.error(`[BalanceService] Invalid deduct parameters: userId=${userId}, amount=${amount}`);
        return reject(new Error('Invalid deduct parameters'));
      }

      // Security check for account operations
      if (referenceType === 'account_creation' || referenceType === 'account_renewal') {
        console.log(`[BalanceService] ACCOUNT OPERATION - Deducting ${amount} from user ${userId} (${referenceType})`);
      }

      const db = new sqlite3.Database(dbPath);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Get current balance
        db.get('SELECT balance, role FROM users WHERE id = ?', [userId], (err, row) => {
          if (err || !row) {
            db.run('ROLLBACK');
            db.close();
            console.error(`[BalanceService] User not found or database error: ${err?.message}`);
            return reject(new Error('User not found or database error'));
          }

          const balanceBefore = row.balance || 0;
          const userRole = row.role || 'member';
          const balanceAfter = balanceBefore - amount;

          console.log(`[BalanceService] Deduction details - User: ${userId} (${userRole}), Before: ${balanceBefore}, Amount: ${amount}, After: ${balanceAfter}`);

          if (balanceAfter < 0) {
            db.run('ROLLBACK');
            db.close();
            console.error(`[BalanceService] Insufficient balance: ${balanceBefore} < ${amount}`);
            return reject(new Error('Insufficient balance'));
          }

          // Update user balance
          db.run('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              db.close();
              console.error(`[BalanceService] Failed to update balance: ${err.message}`);
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
                console.error(`[BalanceService] Failed to record transaction: ${err.message}`);
                return reject(new Error('Failed to record transaction'));
              }

              db.run('COMMIT');
              db.close();
              
              console.log(`[BalanceService] SUCCESS - Deducted ${amount} from user ${userId}. Balance: ${balanceBefore} -> ${balanceAfter}`);
              
              resolve({
                success: true,
                balanceBefore,
                balanceAfter,
                amount,
                description,
                userRole
              });
            });
          });
        });
      });
    });
  }

  // Add balance to user account (ONLY for topup and refunds)
  static addBalance(userId, amount, description, referenceType = null, referenceId = null) {
    return new Promise((resolve, reject) => {
      // Input validation
      if (!userId || amount <= 0) {
        console.error(`[BalanceService] Invalid add parameters: userId=${userId}, amount=${amount}`);
        return reject(new Error('Invalid add parameters'));
      }

      // Security: NEVER allow addBalance for account operations
      if (referenceType === 'account_creation') {
        console.error(`[BalanceService] SECURITY VIOLATION - Attempted to ADD balance for account creation`);
        return reject(new Error('Cannot add balance for account creation'));
      }

      console.log(`[BalanceService] Adding balance: ${amount} to user ${userId} (${referenceType || 'general'})`);

      const db = new sqlite3.Database(dbPath);

      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Get current balance and role
        db.get('SELECT balance, role FROM users WHERE id = ?', [userId], (err, row) => {
          if (err || !row) {
            db.run('ROLLBACK');
            db.close();
            return reject(new Error('User not found or database error'));
          }

          const balanceBefore = row.balance || 0;
          const balanceAfter = balanceBefore + amount;
          const currentRole = row.role || 'member';
          let newRole = currentRole;

          // Check if user should be upgraded to reseller (only for topup operations)
          if (currentRole === 'member' && amount >= 25000 && referenceType === 'topup') {
            newRole = 'reseller';
            console.log(`[BalanceService] Role upgrade triggered for user ${userId}: ${currentRole} -> ${newRole}`);
          }

          // Update user balance and potentially role
          const updateQuery = newRole !== currentRole 
            ? 'UPDATE users SET balance = ?, role = ? WHERE id = ?'
            : 'UPDATE users SET balance = ? WHERE id = ?';
          
          const updateParams = newRole !== currentRole 
            ? [balanceAfter, newRole, userId]
            : [balanceAfter, userId];

          db.run(updateQuery, updateParams, (err) => {
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
              
              console.log(`[BalanceService] SUCCESS - Added ${amount} to user ${userId}. Balance: ${balanceBefore} -> ${balanceAfter}, Role: ${newRole}`);
              
              resolve({
                success: true,
                balanceBefore,
                balanceAfter,
                amount,
                description,
                roleUpdated: newRole !== currentRole,
                newRole,
                previousRole: currentRole
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
