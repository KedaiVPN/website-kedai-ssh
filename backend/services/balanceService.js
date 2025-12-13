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
    // Use FOR UPDATE to lock the row and prevent race conditions
    const [rows] = await connection.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
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

      if (currentRole === 'member' && amount >= 150000 && referenceType === 'topup') {
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

  static censorPhoneNumber(phone) {
    if (!phone || phone.length < 8) return phone;
    return phone.substring(0, 4) + '****' + phone.substring(phone.length - 4);
  }

  static truncatePackageName(name, maxLength = 20) {
    if (!name || name.length <= maxLength) return name;
    return name.substring(0, maxLength) + '...';
  }

  static async getPublicTransactionLog(options = {}) {
    const { filter = 'this_month', userId = null, limit = 200 } = options;

    let dateFilter = '';
    switch (filter) {
      case 'today':
        dateFilter = 'AND DATE(bt.created_at) = CURDATE()';
        break;
      case '3days':
        dateFilter = 'AND bt.created_at >= DATE_SUB(NOW(), INTERVAL 3 DAY)';
        break;
      case 'this_month':
        dateFilter = 'AND MONTH(bt.created_at) = MONTH(NOW()) AND YEAR(bt.created_at) = YEAR(NOW())';
        break;
      case 'last_month':
        dateFilter = 'AND MONTH(bt.created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND YEAR(bt.created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))';
        break;
      default:
        dateFilter = 'AND MONTH(bt.created_at) = MONTH(NOW()) AND YEAR(bt.created_at) = YEAR(NOW())';
    }

    const userFilter = userId ? 'AND bt.user_id = ?' : '';
    const params = userId ? [userId, limit] : [limit];

    const query = `
      SELECT
        bt.id,
        bt.user_id,
        u.username,
        bt.type,
        bt.amount,
        bt.description,
        bt.reference_type,
        bt.reference_id,
        bt.balance_before,
        bt.balance_after,
        bt.created_at,
        COALESCE(
          (SELECT phone FROM xl_transactions WHERE id = bt.reference_id AND bt.reference_type = 'xl_transaction'),
          (SELECT customer_no FROM game_topup_transactions WHERE id = bt.reference_id AND bt.reference_type = 'game_topup')
        ) AS phone_number,
        COALESCE(
          (SELECT package_name FROM xl_transactions WHERE id = bt.reference_id AND bt.reference_type = 'xl_transaction'),
          (SELECT product_name FROM game_topup_transactions WHERE id = bt.reference_id AND bt.reference_type = 'game_topup')
        ) AS package_name,
        COALESCE(
          (SELECT s.nama_server FROM vpn_account va JOIN Server s ON va.server_id = s.id WHERE va.id = bt.reference_id AND bt.reference_type IN ('account_creation', 'account_renewal')),
          (SELECT dp.brand FROM game_topup_transactions gtt JOIN digiflazz_products dp ON gtt.product_sku = dp.buyer_sku_code WHERE gtt.id = bt.reference_id AND bt.reference_type = 'game_topup')
        ) AS server_name,
        CASE
          WHEN bt.reference_type IN ('account_creation', 'account_renewal') THEN (SELECT ip_limit FROM vpn_account WHERE id = bt.reference_id)
          ELSE NULL
        END AS ip_limit
      FROM balance_transactions bt
      JOIN users u ON bt.user_id = u.id
      WHERE bt.reference_type != 'trial'
        AND bt.reference_type IS NOT NULL
        ${dateFilter}
        ${userFilter}
      ORDER BY bt.created_at DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(query, params);

    // Process data: censor phone numbers and truncate package names
    return rows.map(row => ({
      ...row,
      phone_number: row.phone_number ? this.censorPhoneNumber(row.phone_number) : null,
      package_name: row.package_name ? this.truncatePackageName(row.package_name) : null
    }));
  }
}

module.exports = BalanceService;
