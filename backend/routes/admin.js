const express = require('express');
const axios = require("axios");
const dayjs = require("dayjs");
const BalanceService = require("../services/balanceService");
const TelegramService = require("../services/telegramService");
const pool = require('../db/connection');
const router = express.Router();
const { generateTokenForUser } = require('../middleware/auth');
const { purgeOldRecords } = require('../services/cleanupService');
const SystemSettingsService = require('../services/systemSettingsService');

// Get payment gateway config
router.get('/payment-gateway', async (req, res) => {
  try {
    const gateway = await SystemSettingsService.getActivePaymentGateway();
    res.json({ gateway });
  } catch (err) {
    console.error('Error fetching payment gateway:', err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update payment gateway config
router.post('/payment-gateway', async (req, res) => {
  const { gateway } = req.body;
  if (!['TRIPAY', 'MIDTRANS'].includes(gateway)) {
    return res.status(400).json({ error: 'Invalid gateway. Must be TRIPAY or MIDTRANS' });
  }

  try {
    await SystemSettingsService.setSetting('active_payment_gateway', gateway);
    res.json({ success: true, gateway });
  } catch (err) {
    console.error('Error updating payment gateway:', err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all servers (including pricing)
router.get('/servers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, sp.member_1ip, sp.member_2ip, sp.member_4ip, sp.reseller_1ip, sp.reseller_2ip, sp.reseller_4ip
      FROM Server s
      LEFT JOIN server_pricing sp ON sp.server_id = s.id
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "DB Error" });
  }
});

// Add new server
router.post('/servers', async (req, res) => {
  const {
    domain, auth, nama_server, location = 'Unknown', protocols = 'ssh,vmess,vless,trojan',
    status = 'online', batas_create_akun = 1000, member_1ip = 330, member_2ip = 430,
    member_4ip = 600, reseller_1ip = 165, reseller_2ip = 215, reseller_4ip = 300
  } = req.body;

  if (!domain || !auth || !nama_server) {
    return res.status(400).json({ error: "Field domain, auth, nama_server wajib diisi" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO Server (domain, auth, nama_server, location, protocols, status, batas_create_akun) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [domain, auth, nama_server, location, protocols, status, batas_create_akun]
    );
    const serverId = result.insertId;

    await connection.query(
      `INSERT INTO server_pricing (server_id, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [serverId, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip]
    );

    await connection.commit();

    const [rows] = await connection.query(
      `SELECT s.*, sp.member_1ip, sp.member_2ip, sp.member_4ip, sp.reseller_1ip, sp.reseller_2ip, sp.reseller_4ip
       FROM Server s
       LEFT JOIN server_pricing sp ON sp.server_id = s.id
       WHERE s.id = ?`,
      [serverId]
    );
    res.json(rows[0]);
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: "Insert failed" });
  } finally {
    connection.release();
  }
});

// Edit server by ID
router.put('/servers/:id', async (req, res) => {
  const {
    domain, auth, nama_server, location, protocols, status, batas_create_akun,
    member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip
  } = req.body;

  if (!domain || !auth || !nama_server) {
    return res.status(400).json({ error: "Field domain, auth, nama_server wajib diisi" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `UPDATE Server SET domain = ?, auth = ?, nama_server = ?, location = ?, protocols = ?, status = ?, batas_create_akun = ? WHERE id = ?`,
      [domain, auth, nama_server, location, protocols, status, batas_create_akun, req.params.id]
    );

    await connection.query(
      `INSERT INTO server_pricing (server_id, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         member_1ip = VALUES(member_1ip), member_2ip = VALUES(member_2ip), member_4ip = VALUES(member_4ip),
         reseller_1ip = VALUES(reseller_1ip), reseller_2ip = VALUES(reseller_2ip), reseller_4ip = VALUES(reseller_4ip)`,
      [req.params.id, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip]
    );

    await connection.commit();

    const [rows] = await connection.query(
      `SELECT s.*, sp.member_1ip, sp.member_2ip, sp.member_4ip, sp.reseller_1ip, sp.reseller_2ip, sp.reseller_4ip
       FROM Server s
       LEFT JOIN server_pricing sp ON sp.server_id = s.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: "Update failed" });
  } finally {
    connection.release();
  }
});

// Delete server by ID
router.delete('/servers/:id', async (req, res) => {
  try {
    await pool.query("DELETE FROM Server WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// Get all users with balance, role and transaction info
router.get('/users', async (req, res) => {
  try {
    const { search, withScheduled } = req.query;
    let query = `
      SELECT
        u.id, u.username, u.email, u.phone_number, u.balance, u.is_locked, u.role, u.created_at,
        COALESCE(t.transaction_count, 0) as transaction_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as transaction_count
        FROM balance_transactions
        GROUP BY user_id
      ) t ON u.id = t.user_id
    `;
    const params = [];
    const whereClauses = [];

    if (search) {
      whereClauses.push('(u.username LIKE ? OR u.email LIKE ? OR u.phone_number = ?)');
      params.push(`%${search}%`, `%${search}%`, search);
    }

    if (withScheduled === 'true') {
      query += `
        JOIN (
          SELECT DISTINCT user_id
          FROM xl_scheduled_purchases
          WHERE status = 'active'
        ) AS scheduled_users ON u.id = scheduled_users.user_id
      `;
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ' ORDER BY u.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Add balance to user
router.post('/users/:id/add-balance', async (req, res) => {
  const { amount, description } = req.body;
  const userId = req.params.id;

  if (!amount || amount <= 0 || !description) {
    return res.status(400).json({ error: "Amount dan description wajib diisi" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    const balanceBefore = userRows[0].balance || 0;
    const balanceAfter = balanceBefore + parseInt(amount);

    await connection.query('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);
    await connection.query('UPDATE users SET total_transaksi = total_transaksi + 1 WHERE id = ?', [userId]);
    await connection.query(
      `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, balance_before, balance_after) VALUES (?, 'credit', ?, ?, 'admin_topup', ?, ?)`,
      [userId, amount, description, balanceBefore, balanceAfter]
    );

    await connection.commit();
    res.json({ success: true, balanceBefore, balanceAfter, amount: parseInt(amount) });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    connection.release();
  }
});

// Deduct balance from user
router.post('/users/:id/deduct-balance', async (req, res) => {
  const { amount, description } = req.body;
  const userId = req.params.id;

  if (!amount || amount <= 0 || !description) {
    return res.status(400).json({ error: "Amount dan description wajib diisi" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'User not found' });
    }

    const balanceBefore = userRows[0].balance || 0;
    const balanceAfter = balanceBefore - parseInt(amount);

    await connection.query('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);
    await connection.query('UPDATE users SET total_transaksi = total_transaksi + 1 WHERE id = ?', [userId]);
    await connection.query(
      `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, balance_before, balance_after) VALUES (?, 'debit', ?, ?, 'admin_deduction', ?, ?)`,
      [userId, amount, description, balanceBefore, balanceAfter]
    );

    await connection.commit();
    res.json({ success: true, balanceBefore, balanceAfter, amount: parseInt(amount) });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: 'Transaction failed' });
  } finally {
    connection.release();
  }
});

// Lock user
router.post('/users/:id/lock', async (req, res) => {
  const userId = req.params.id;
  try {
    const [result] = await pool.query('UPDATE users SET is_locked = 1 WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User locked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to lock user' });
  }
});

// Unlock user
router.post('/users/:id/unlock', async (req, res) => {
  const userId = req.params.id;
  try {
    const [result] = await pool.query('UPDATE users SET is_locked = 0 WHERE id = ?', [userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User unlocked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unlock user' });
  }
});

// Update user role (member <-> reseller)
router.post('/users/:id/role', async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role || !['member', 'reseller'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Use "member" or "reseller".' });
  }

  try {
    let updateQuery;
    if (role === 'reseller') {
      updateQuery = 'UPDATE users SET role = ?, reseller_since = NOW() WHERE id = ?';
    } else { // role is 'member'
      updateQuery = 'UPDATE users SET role = ?, reseller_since = NULL WHERE id = ?';
    }

    const [result] = await pool.query(updateQuery, [role, userId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const newToken = await generateTokenForUser(userId);
    res.json({ success: true, message: `User role updated to ${role}`, newToken });
  } catch (err) {
    console.error('Failed to update role or generate token:', err);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get user transaction history
router.get('/users/:id/transactions', async (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const limit = parseInt(req.query.limit, 10) || 20;

  if (isNaN(userId) || isNaN(limit)) {
    return res.status(400).json({ error: 'Invalid user ID or limit' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT * FROM balance_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Manual database cleanup endpoint
router.post('/cleanup', async (req, res) => {
  console.log('Received request to /api/admin/cleanup');
  try {
    const result = await purgeOldRecords();
    console.log('Cleanup successful:', result.message);
    res.status(200).json({ success: true, message: 'Database cleanup process completed successfully.' });
  } catch (error) {
    console.error('Failed to execute cleanup:', error);
    res.status(500).json({ success: false, message: 'Failed to execute database cleanup.', error: error.message });
  }
});

// --- XL Scheduled Purchases Admin Endpoints ---

// Get all scheduled purchases for a specific user
router.get('/users/:userId/scheduled-purchases', async (req, res) => {
    try {
        const { userId } = req.params;
        const [schedules] = await pool.query(
            `SELECT sp.id, u.username, sp.phone_number, xp.name as package_name, sp.scheduled_date
             FROM xl_scheduled_purchases sp
             JOIN users u ON sp.user_id = u.id
             JOIN xl_packages xp ON sp.package_code = xp.package_code
             WHERE sp.user_id = ? AND sp.status = 'active'
             ORDER BY sp.scheduled_date ASC`,
            [userId]
        );
        res.json(schedules);
    } catch (error) {
        console.error('[Admin Route] Get User Scheduled Purchases error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pembelian terjadwal.' });
    }
});

// Delete a specific scheduled purchase
router.delete('/scheduled-purchases/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const [result] = await pool.query(
            "DELETE FROM xl_scheduled_purchases WHERE id = ? AND status = 'active'",
            [scheduleId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan atau sudah tidak aktif.' });
        }

        res.json({ success: true, message: 'Jadwal pembelian berhasil dibatalkan oleh admin.' });
    } catch (error) {
        console.error('[Admin Route] Cancel Scheduled Purchase error:', error);
        res.status(500).json({ success: false, message: 'Gagal membatalkan jadwal.' });
    }
});


// Get accounts for a specific server
router.get('/servers/:id/accounts', async (req, res) => {
  const serverId = req.params.id;
  try {
    const query = `
      SELECT
        v.*,
        u.username as owner_username,
        u.email as owner_email,
        DATE_FORMAT(v.expired_date, '%Y-%m-%d %H:%i') as expired_date_formatted
      FROM vpn_account v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE v.server_id = ?
      ORDER BY v.created_at DESC
    `;
    const [rows] = await pool.query(query, [serverId]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching server accounts:', err);
    res.status(500).json({ error: "Failed to fetch server accounts" });
  }
});






async function renewAccountOnServerForAdmin(protocol, identifier, exp, quota, limitip, server) {
  if (protocol !== 'zivpn' && (/\s/.test(identifier) || /[^a-zA-Z0-9]/.test(identifier))) {
    throw new Error('❌ Username tidak valid.');
  }

  const port = server.domain.includes("-upc.") ? 8443 : 5888;
  const renewalEndpoints = {
    ssh: `renewssh?user=${identifier}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    vmess: `renewvmess?user=${identifier}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    vless: `renewvless?user=${identifier}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    trojan: `renewtrojan?user=${identifier}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    zivpn: `renew/zivpn?password=${identifier}&exp=${exp}`
  };

  const endpoint = renewalEndpoints[protocol];
  const url = `http://${server.domain}:${port}/${endpoint}&auth=${server.auth}`;
  const response = await axios.get(url);

  if (response.data.status !== "success") {
    throw new Error(`❌ Terjadi kesalahan: ${response.data.message}`);
  }
  return response.data;
}

const deleteEndpointMap = {
  ssh: 'deletessh',
  vmess: 'deletevmess',
  vless: 'deletevless',
  trojan: 'deletetrojan',
  zivpn: 'delete/zivpn'
};

// Admin endpoint to renew VPN account using the owner's balance
router.post('/accounts/:accountId/renew', async (req, res) => {
  const { accountId } = req.params;
  const { duration } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [accounts] = await connection.query(
      `SELECT va.*, s.id as server_id, s.domain, s.auth, s.nama_server, u.username as owner_username
       FROM vpn_account va
       LEFT JOIN Server s ON va.server_id = s.id
       LEFT JOIN users u ON va.user_id = u.id
       WHERE va.id = ?`,
      [accountId]
    );
    const account = accounts[0];

    if (!account) {
      throw new Error('Account not found');
    }

    const userId = account.user_id; // Owner's user ID
    const { username, password, protocol, server_id, quota, ip_limit } = account;

    // Calculate cost based on owner's role
    const userRole = await BalanceService.getUserRole(userId);
    const renewalCost = await BalanceService.calculateServerAccountCost(ip_limit, duration, userRole, server_id);

    // Validate owner's balance
    await BalanceService.validateSufficientBalance(userId, renewalCost, connection);

    // Deduct from owner's balance
    await BalanceService.deductBalance(
      userId, renewalCost, `Perpanjang akun ${protocol.toUpperCase()} oleh Admin - ${username} (${duration} hari)`,
      'account_renewal', accountId, connection
    );

    let exp_param = duration;
    if (protocol === 'ssh') {
        const currentExpiry = new Date(account.expired_date);
        const now = new Date();
        const startDate = currentExpiry > now ? currentExpiry : now;
        const newExpiry = new Date(startDate);
        newExpiry.setDate(newExpiry.getDate() + duration);
        exp_param = newExpiry.toISOString().split('T')[0];
    }

    const identifier = protocol === 'zivpn' ? password : username;
    const renewResult = await renewAccountOnServerForAdmin(protocol, identifier, exp_param, quota, ip_limit, account);

    let newExpiredDate;
    if (protocol === 'ssh' || protocol === 'zivpn') {
      const currentExpiry = new Date(account.expired_date);
      const now = new Date();
      const startDate = currentExpiry > now ? currentExpiry : now;
      const finalNewExpiry = new Date(startDate);
      finalNewExpiry.setDate(finalNewExpiry.getDate() + duration);
      newExpiredDate = finalNewExpiry;
    } else {
      newExpiredDate = renewResult.data.expired;
    }

    await connection.query(
      'UPDATE vpn_account SET expired_date = ?, duration = ? WHERE id = ?',
      [newExpiredDate, duration, accountId]
    );

    await connection.commit();
    res.json({ success: true, message: renewResult.message });

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

// Admin endpoint to delete VPN account and refund to owner
router.delete('/accounts/:accountId', async (req, res) => {
  const { accountId } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [accounts] = await connection.query(
      `SELECT va.*, s.domain, s.auth
       FROM vpn_account va
       LEFT JOIN Server s ON va.server_id = s.id
       WHERE va.id = ?`,
      [accountId]
    );
    const account = accounts[0];
    if (!account) {
      throw new Error('❌ Akun tidak ditemukan.');
    }

    const { username, password, protocol, server_id, expired_date, ip_limit, user_id } = account;

    if (!account.domain) {
      throw new Error('❌ Server tidak ditemukan.');
    }

    const endpoint = deleteEndpointMap[protocol];
    if (!endpoint) {
      throw new Error('❌ Jenis akun tidak valid untuk penghapusan.');
    }

    const userRole = await BalanceService.getUserRole(user_id);
    const port = account.domain.includes("-upc.") ? 8443 : 5888;

    let apiURL;
    if (protocol === 'zivpn') {
      apiURL = `http://${account.domain}:${port}/delete/zivpn?password=${password}&auth=${account.auth}`;
    } else {
      apiURL = `http://${account.domain}:${port}/${endpoint}?user=${username}&auth=${account.auth}`;
    }

    const response = await axios.get(apiURL);
    if (response.data.status !== 'success') {
      throw new Error(`❌ Gagal menghapus akun di server: ${response.data.message}`);
    }

    const now = dayjs();
    let sisaHari = Math.ceil(dayjs(expired_date).diff(now, 'millisecond') / (1000 * 60 * 60 * 24));
    if (sisaHari < 0) sisaHari = 0;

    let refundAmount = 0;
    if (sisaHari > 0) {
      const dailyPrice = await BalanceService.getDailyPrice(ip_limit, userRole, server_id);
      refundAmount = dailyPrice * sisaHari;
    }

    await connection.query('DELETE FROM vpn_account WHERE id = ?', [accountId]);

    if (refundAmount > 0) {
      await BalanceService.addBalance(
        user_id,
        refundAmount,
        `Refund penghapusan akun ${protocol.toUpperCase()} oleh Admin - ${username} (${sisaHari} hari, ${userRole})`,
        'account_refund',
        accountId,
        connection
      );
    }

    await connection.commit();

    const roleText = userRole === 'reseller' ? ' (harga reseller)' : '';
    res.json({
      success: true,
      message: `✅ Akun ${protocol.toUpperCase()} berhasil dihapus.\n🕒 Sisa hari: ${sisaHari}${refundAmount > 0 ? `\n💰 Refund ke User: Rp${refundAmount.toLocaleString('id-ID')}${roleText}` : ''}`
    });

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message || 'Failed to delete account' });
  } finally {
    connection.release();
  }
});
module.exports = router;
