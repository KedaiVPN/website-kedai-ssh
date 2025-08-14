
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
  // Get daily price by IP limit and user role (global/default pricing)
  static getPriceByIPLimit(ipLimit, userRole = 'member') {
    const price = PRICING_BY_IP_LIMIT[ipLimit];
    if (!price) {
      throw new Error(`Invalid IP limit: ${ipLimit}`);
    }
    // Apply 50% discount for resellers
    if (userRole === 'reseller') {
      return Math.floor(price * 0.5);
    }
    return price;
  }

  // Calculate total account cost with role-based pricing (global/default)
  static calculateAccountCost(ipLimit, duration, userRole = 'member') {
    const dailyPrice = this.getPriceByIPLimit(ipLimit, userRole);
    const totalCost = dailyPrice * duration;
    console.log(`[BalanceService] Cost calculation (global): ${ipLimit} IP × ${duration} days × ${dailyPrice}/day = ${totalCost} (Role: ${userRole})`);
    return totalCost;
  }

  // Get daily price, prioritizing per-server pricing if available
  static getDailyPrice(ipLimit, userRole = 'member', serverId = null) {
    return new Promise((resolve) => {
      if (!serverId) {
        return resolve(this.getPriceByIPLimit(ipLimit, userRole));
      }

      const db = new sqlite3.Database(dbPath);
      db.get(
        `SELECT member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip FROM server_pricing WHERE server_id = ?`,
        [serverId],
        (err, row) => {
          db.close();
          if (err || !row) {
            // Fallback to global pricing
            const fallback = BalanceService.getPriceByIPLimit(ipLimit, userRole);
            console.log(`[BalanceService] Using fallback global pricing for server ${serverId}: ${fallback}`);
            return resolve(fallback);
          }

          const key = `${userRole}_${ipLimit}ip`;
          const price = row[key];
          if (typeof price === 'number' && price > 0) {
            console.log(`[BalanceService] Using server pricing (server: ${serverId}) -> ${key}: ${price}`);
            return resolve(price);
          }

          const fallback = BalanceService.getPriceByIPLimit(ipLimit, userRole);
          console.log(`[BalanceService] Missing/invalid server pricing for ${key}, fallback to global: ${fallback}`);
          resolve(fallback);
        }
      );
    });
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
