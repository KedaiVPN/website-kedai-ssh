const pool = require('../db/connection');
const { generateTokenForUser } = require('../middleware/auth');

const PRICING_BY_IP_LIMIT = {
  1: 330, 2: 430, 4: 600
};

class BalanceService {
  static getPriceByIPLimit(ipLimit, userRole = 'member') {
    const price = PRICING_BY_IP_LIMIT[ipLimit];
    if (!price) throw new Error(`Invalid IP limit: ${ipLimit}`);
    return userRole === 'reseller' ? Math.floor(price * 0.5) : price;
  }

  static async getDailyPrice(ipLimit, userRole = 'member', serverId = null) {
    if (!serverId) {
      return this.getPriceByIPLimit(ipLimit, userRole);
    }
    try {
      const [rows] = await pool.query(`SELECT * FROM server_pricing WHERE server_id = ?`, [serverId]);
      if (rows.length === 0) {
        return this.getPriceByIPLimit(ipLimit, userRole);
      }
      const row = rows[0];
      const key = `${userRole}_${ipLimit}ip`;
      const price = row[key];
      if (typeof price === 'number' && price > 0) {
        return price;
      }
      return this.getPriceByIPLimit(ipLimit, userRole);
    } catch (err) {
      return this.getPriceByIPLimit(ipLimit, userRole);
    }
  }

  static async calculateServerAccountCost(ipLimit, duration, userRole = 'member', serverId = null) {
    const dailyPrice = await this.getDailyPrice(ipLimit, userRole, serverId);
    return dailyPrice * duration;
  }

  static async getUserStats(userId) {
    const [rows] = await pool.query('SELECT balance, created_vpn FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) throw new Error('User not found');
    return rows[0];
  }

  static async getUserRole(userId) {
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) throw new Error('User not found');
    return rows[0].role || 'member';
  }

  static async validateSufficientBalance(userId, requiredAmount, connection = pool) {
    const [rows] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) throw new Error('User not found');
    const currentBalance = rows[0].balance || 0;
    const sufficient = currentBalance >= requiredAmount;
    if (!sufficient) {
      throw new Error('Insufficient balance');
    }
    return { sufficient, currentBalance, requiredAmount, shortage: Math.max(0, requiredAmount - currentBalance) };
  }

  static async deductBalance(userId, amount, description, referenceType = null, referenceId = null, connection = pool) {
    if (!userId || amount <= 0) throw new Error('Invalid deduct parameters');

    const db = connection.constructor.name === 'Pool' ? await connection.getConnection() : connection;
    try {
      if (connection.constructor.name === 'Pool') await db.beginTransaction();
      
      const [userRows] = await db.query('SELECT balance, role FROM users WHERE id = ? FOR UPDATE', [userId]);
      if (userRows.length === 0) throw new Error('User not found');

      const { balance: balanceBefore, role: userRole } = userRows[0];
      const balanceAfter = balanceBefore - amount;
      if (balanceAfter < 0) throw new Error('Insufficient balance');

      await db.query('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);

      const isCreation = referenceType === 'account_creation';
      const counterQuery = isCreation
        ? 'UPDATE users SET total_transaksi = total_transaksi + 1, created_vpn = created_vpn + 1 WHERE id = ?'
        : 'UPDATE users SET total_transaksi = total_transaksi + 1 WHERE id = ?';
      await db.query(counterQuery, [userId]);

      await db.query(
        `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'debit', ?, ?, ?, ?, ?, ?)`,
        [userId, amount, description, referenceType, referenceId, balanceBefore, balanceAfter]
      );

      if (connection.constructor.name === 'Pool') await db.commit();
      return { success: true, balanceBefore, balanceAfter, amount, description, userRole };
    } catch (error) {
      if (connection.constructor.name === 'Pool') await db.rollback();
      throw error;
    } finally {
      if (connection.constructor.name === 'Pool') db.release();
    }
  }

  static async addBalance(userId, amount, description, referenceType = null, referenceId = null, connection = pool) {
    if (!userId || amount <= 0) throw new Error('Invalid add parameters');
    if (referenceType === 'account_creation') throw new Error('Cannot add balance for account creation');

    const db = connection.constructor.name === 'Pool' ? await connection.getConnection() : connection;
    try {
      if (connection.constructor.name === 'Pool') await db.beginTransaction();

      const [userRows] = await db.query('SELECT balance, role FROM users WHERE id = ? FOR UPDATE', [userId]);
      if (userRows.length === 0) throw new Error('User not found');

      const { balance: balanceBefore, role: currentRole } = userRows[0];
      const balanceAfter = balanceBefore + amount;
      let newRole = currentRole;

      if (currentRole === 'member' && amount >= 25000 && referenceType === 'topup') {
        newRole = 'reseller';
      }

      if (newRole !== currentRole) {
        // User is upgraded to reseller, set role and reseller_since timestamp
        await db.query(
          "UPDATE users SET balance = ?, role = ?, reseller_since = NOW() WHERE id = ?",
          [balanceAfter, newRole, userId]
        );
      } else {
        // Just a regular balance update
        await db.query(
          "UPDATE users SET balance = ? WHERE id = ?",
          [balanceAfter, userId]
        );
      }

      await db.query('UPDATE users SET total_transaksi = total_transaksi + 1 WHERE id = ?', [userId]);

      await db.query(
        `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'credit', ?, ?, ?, ?, ?, ?)`,
        [userId, amount, description, referenceType, referenceId, balanceBefore, balanceAfter]
      );

      if (connection.constructor.name === 'Pool') await db.commit();

      let newToken = null;
      if (newRole !== currentRole) {
        newToken = await generateTokenForUser(userId);
      }

      return { success: true, balanceBefore, balanceAfter, amount, description, roleUpdated: newRole !== currentRole, newRole, newToken };
    } catch (error) {
      if (connection.constructor.name === 'Pool') await db.rollback();
      throw error;
    } finally {
      if (connection.constructor.name === 'Pool') db.release();
    }
  }

  static async getTransactionHistory(userId, limit = 50) {
    const [rows] = await pool.query('SELECT * FROM balance_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
    return rows;
  }
}

module.exports = BalanceService;
