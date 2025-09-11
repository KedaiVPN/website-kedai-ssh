const express = require('express');
const pool = require('../db/connection');
const router = express.Router();
const { generateTokenForUser } = require('../middleware/auth');
const { purgeOldRecords } = require('../services/cleanupService');

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
    const [rows] = await pool.query(`
      SELECT
        u.id, u.username, u.email, u.balance, u.is_locked, u.role, u.created_at,
        COALESCE(t.transaction_count, 0) as transaction_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as transaction_count
        FROM balance_transactions
        GROUP BY user_id
      ) t ON u.id = t.user_id
      ORDER BY u.created_at DESC
    `);
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
    const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
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
  const userId = req.params.id;
  const limit = req.query.limit || 20;

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

module.exports = router;
