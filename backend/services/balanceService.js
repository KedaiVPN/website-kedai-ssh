const pool = require('../db/connection');

// This map seems to be the primary source of pricing, as the server_pricing table does not exist in init.sql.
// We will keep this logic to ensure behavior remains consistent post-migration.
const PRICING_BY_IP_LIMIT = {
  1: 330,  // Rp330/hari
  2: 430,  // Rp430/hari
  4: 600   // Rp600/hari
};

class BalanceService {
  /**
   * Gets the daily price for a given IP limit and user role.
   * This is the global/default pricing logic.
   */
  static getPriceByIPLimit(ipLimit, userRole = 'member') {
    const price = PRICING_BY_IP_LIMIT[ipLimit];
    if (price === undefined) {
      throw new Error(`Invalid IP limit: ${ipLimit}`);
    }
    // Apply a 50% discount for resellers.
    if (userRole === 'reseller') {
      return Math.floor(price * 0.5);
    }
    return price;
  }

  /**
   * Calculates the total cost for an account based on global/default pricing.
   */
  static calculateAccountCost(ipLimit, duration, userRole = 'member') {
    const dailyPrice = this.getPriceByIPLimit(ipLimit, userRole);
    const totalCost = dailyPrice * duration;
    console.log(`[BalanceService] Cost calculation: ${ipLimit} IP × ${duration} days × ${dailyPrice}/day = ${totalCost} (Role: ${userRole})`);
    return totalCost;
  }

  /**
   * Retrieves user statistics (balance, total created accounts).
   * @param {number} userId - The ID of the user.
   * @returns {Promise<object>} An object with user's balance and created_vpn count.
   */
  static async getUserStats(userId) {
    const [rows] = await pool.execute('SELECT balance, created_vpn FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      throw new Error('User not found');
    }
    return rows[0];
  }

  /**
   * Retrieves the role for a given user.
   * @param {number} userId - The ID of the user.
   * @returns {Promise<string>} The user's role.
   */
  static async getUserRole(userId) {
    const [rows] = await pool.execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      throw new Error('User not found');
    }
    return rows[0].role || 'member';
  }

  /**
   * Validates if a user has sufficient balance for a given amount.
   * @param {number} userId - The ID of the user.
   * @param {number} requiredAmount - The amount required.
   * @returns {Promise<object>} An object indicating if the balance is sufficient.
   */
  static async validateSufficientBalance(userId, requiredAmount) {
    const userStats = await this.getUserStats(userId);
    const currentBalance = userStats.balance || 0;
    const sufficient = currentBalance >= requiredAmount;

    console.log(`[BalanceService] Balance validation - User: ${userId}, Required: ${requiredAmount}, Current: ${currentBalance}, Sufficient: ${sufficient}`);

    return {
      sufficient,
      currentBalance,
      requiredAmount,
      shortage: Math.max(0, requiredAmount - currentBalance)
    };
  }

  /**
   * Deducts balance from a user's account within a database transaction.
   * This is a critical transactional operation.
   * @returns {Promise<object>} An object indicating the result of the deduction.
   */
  static async deductBalance(userId, amount, description, referenceType = null, referenceId = null) {
    if (!userId || !amount || amount <= 0) {
      throw new Error('Invalid parameters for balance deduction.');
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Lock the user row to prevent race conditions
      const [userRows] = await connection.execute('SELECT balance, role FROM users WHERE id = ? FOR UPDATE', [userId]);

      if (userRows.length === 0) {
        throw new Error('User not found');
      }

      const user = userRows[0];
      const balanceBefore = user.balance || 0;

      if (balanceBefore < amount) {
        throw new Error('Insufficient balance');
      }

      const balanceAfter = balanceBefore - amount;

      // 1. Update user's balance
      await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);

      // 2. Update user's transaction and creation counters
      const isCreation = referenceType === 'account_creation';
      const counterQuery = isCreation
        ? 'UPDATE users SET total_transaksi = total_transaksi + 1, created_vpn = created_vpn + 1 WHERE id = ?'
        : 'UPDATE users SET total_transaksi = total_transaksi + 1 WHERE id = ?';
      await connection.execute(counterQuery, [userId]);

      // 3. Record the transaction in the ledger
      await connection.execute(
        `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'debit', ?, ?, ?, ?, ?, ?)`,
        [userId, amount, description, referenceType, referenceId, balanceBefore, balanceAfter]
      );

      await connection.commit();
      console.log(`[BalanceService] SUCCESS - Deducted ${amount} from user ${userId}. Balance: ${balanceBefore} -> ${balanceAfter}`);

      return { success: true, balanceBefore, balanceAfter, amount, userRole: user.role };

    } catch (error) {
      if (connection) await connection.rollback();
      console.error(`[BalanceService] FAILED to deduct balance for user ${userId}:`, error);
      throw error; // Re-throw to be handled by the caller
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Adds balance to a user's account within a database transaction.
   * This is a critical transactional operation, typically for top-ups or refunds.
   * @returns {Promise<object>} An object indicating the result and if the role was updated.
   */
  static async addBalance(userId, amount, description, referenceType = null, referenceId = null) {
    if (!userId || !amount || amount <= 0) {
      throw new Error('Invalid parameters for adding balance.');
    }
    // Security check: Never allow adding balance for account creation to prevent exploits.
    if (referenceType === 'account_creation') {
      throw new Error('SECURITY VIOLATION: Cannot add balance for account creation.');
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Lock the user row to prevent race conditions
      const [userRows] = await connection.execute('SELECT balance, role FROM users WHERE id = ? FOR UPDATE', [userId]);
      if (userRows.length === 0) throw new Error('User not found');

      const user = userRows[0];
      const balanceBefore = user.balance || 0;
      const balanceAfter = balanceBefore + amount;

      let newRole = user.role;
      const roleUpdated = user.role === 'member' && amount >= 25000 && referenceType === 'topup';
      if (roleUpdated) newRole = 'reseller';

      // 1. Update user's balance and potentially their role
      const updateQuery = roleUpdated
        ? 'UPDATE users SET balance = ?, role = ? WHERE id = ?'
        : 'UPDATE users SET balance = ? WHERE id = ?';
      const updateParams = roleUpdated ? [balanceAfter, newRole, userId] : [balanceAfter, userId];
      await connection.execute(updateQuery, updateParams);

      // 2. Update user's transaction counter
      await connection.execute('UPDATE users SET total_transaksi = total_transaksi + 1 WHERE id = ?', [userId]);

      // 3. Record the transaction in the ledger
      await connection.execute(
        `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'credit', ?, ?, ?, ?, ?, ?)`,
        [userId, amount, description, referenceType, referenceId, balanceBefore, balanceAfter]
      );

      await connection.commit();
      console.log(`[BalanceService] SUCCESS - Added ${amount} to user ${userId}. Balance: ${balanceBefore} -> ${balanceAfter}, Role: ${newRole}`);

      return { success: true, balanceAfter, roleUpdated, newRole };

    } catch (error) {
      if (connection) await connection.rollback();
      console.error(`[BalanceService] FAILED to add balance for user ${userId}:`, error);
      throw error; // Re-throw to be handled by the caller
    } finally {
      if (connection) connection.release();
    }
  }

  /**
   * Retrieves the balance transaction history for a user.
   * @param {number} userId - The ID of the user.
   * @param {number} limit - The number of transactions to retrieve.
   * @returns {Promise<Array<object>>} A list of transactions.
   */
  static async getTransactionHistory(userId, limit = 50) {
    const [rows] = await pool.execute(
      'SELECT * FROM balance_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
      [userId, limit]
    );
    return rows;
  }
}

module.exports = BalanceService;
