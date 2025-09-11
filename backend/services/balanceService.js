const pool = require('../db/connection');

const GLOBAL_PRICING_BY_IP_LIMIT = {
  1: 330, 2: 430, 4: 600
};
const GLOBAL_RESELLER_DISCOUNT = 0.5;

class BalanceService {
  static getGlobalDailyPrice(ipLimit, userRole = 'member') {
    const basePrice = GLOBAL_PRICING_BY_IP_LIMIT[ipLimit];
    if (basePrice === undefined) throw new Error(`Invalid IP limit: ${ipLimit}`);
    return userRole === 'reseller' ? Math.floor(basePrice * GLOBAL_RESELLER_DISCOUNT) : basePrice;
  }

  static async getDailyPrice(ipLimit, userRole = 'member', serverId = null) {
    if (serverId) {
      const [rows] = await pool.execute('SELECT * FROM server_pricing WHERE server_id = ?', [serverId]);
      if (rows.length > 0) {
        const serverPriceInfo = rows[0];
        const priceKey = `${userRole}_${ipLimit}ip`;
        const serverPrice = serverPriceInfo[priceKey];
        if (serverPrice != null && serverPrice > 0) {
          console.log(`[BalanceService] Using server-specific price for server ${serverId}: ${serverPrice}`);
          return serverPrice;
        }
      }
    }
    // Fallback to global pricing
    return this.getGlobalDailyPrice(ipLimit, userRole);
  }

  static async calculateCost(ipLimit, duration, userRole = 'member', serverId = null) {
    const dailyPrice = await this.getDailyPrice(ipLimit, userRole, serverId);
    const totalCost = dailyPrice * duration;
    console.log(`[BalanceService] Cost calculation (Server: ${serverId || 'Global'}): ${ipLimit} IP × ${duration} days × Rp${dailyPrice}/day = Rp${totalCost} (Role: ${userRole})`);
    return totalCost;
  }

  static async getUserStats(userId) {
    const [rows] = await pool.execute('SELECT balance, created_vpn FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) throw new Error('User not found');
    return rows[0];
  }

  static async getUserRole(userId) {
    const [rows] = await pool.execute('SELECT role FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) throw new Error('User not found');
    return rows[0].role || 'member';
  }

  static async validateSufficientBalance(userId, requiredAmount) {
    const userStats = await this.getUserStats(userId);
    const currentBalance = userStats.balance || 0;
    const sufficient = currentBalance >= requiredAmount;
    return {
      sufficient,
      currentBalance,
      requiredAmount,
      shortage: Math.max(0, requiredAmount - currentBalance)
    };
  }

  static async deductBalance(userId, amount, description, referenceType = null, referenceId = null) {
    if (!userId || !amount || amount <= 0) throw new Error('Invalid parameters for balance deduction.');
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [userRows] = await connection.execute('SELECT balance, role FROM users WHERE id = ? FOR UPDATE', [userId]);
      if (userRows.length === 0) throw new Error('User not found');
      const user = userRows[0];
      if (user.balance < amount) throw new Error('Insufficient balance');
      const balanceAfter = user.balance - amount;
      await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);
      const counterQuery = referenceType === 'account_creation'
        ? 'UPDATE users SET total_transaksi = total_transaksi + 1, created_vpn = created_vpn + 1 WHERE id = ?'
        : 'UPDATE users SET total_transaksi = total_transaksi + 1 WHERE id = ?';
      await connection.execute(counterQuery, [userId]);
      await connection.execute(
        `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'debit', ?, ?, ?, ?, ?, ?)`,
        [userId, amount, description, referenceType, referenceId, user.balance, balanceAfter]
      );
      await connection.commit();
      return { success: true, balanceAfter };
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  static async addBalance(userId, amount, description, referenceType = null, referenceId = null) {
    if (!userId || !amount || amount <= 0) throw new Error('Invalid parameters for adding balance.');
    if (referenceType === 'account_creation') throw new Error('SECURITY VIOLATION: Cannot add balance for account creation.');
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      const [userRows] = await connection.execute('SELECT balance, role FROM users WHERE id = ? FOR UPDATE', [userId]);
      if (userRows.length === 0) throw new Error('User not found');
      const user = userRows[0];
      const balanceAfter = user.balance + amount;
      let newRole = user.role;
      const roleUpdated = user.role === 'member' && amount >= 25000 && referenceType === 'topup';
      if (roleUpdated) newRole = 'reseller';
      const updateQuery = roleUpdated ? 'UPDATE users SET balance = ?, role = ? WHERE id = ?' : 'UPDATE users SET balance = ? WHERE id = ?';
      const updateParams = roleUpdated ? [balanceAfter, newRole, userId] : [balanceAfter, userId];
      await connection.execute(updateQuery, updateParams);
      await connection.execute('UPDATE users SET total_transaksi = total_transaksi + 1 WHERE id = ?', [userId]);
      await connection.execute(
        `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'credit', ?, ?, ?, ?, ?, ?)`,
        [userId, amount, description, referenceType, referenceId, user.balance, balanceAfter]
      );
      await connection.commit();
      return { success: true, balanceAfter, roleUpdated, newRole };
    } catch (error) {
      if (connection) await connection.rollback();
      throw error;
    } finally {
      if (connection) connection.release();
    }
  }

  static async getTransactionHistory(userId, limit = 50) {
    const [rows] = await pool.execute('SELECT * FROM balance_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
    return rows;
  }
}

module.exports = BalanceService;
