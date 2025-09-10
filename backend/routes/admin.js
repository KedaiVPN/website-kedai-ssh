const express = require('express');
const pool = require('../db/connection');
const { purgeOldRecords } = require('../services/cleanupService');
const { generateTokenForUser } = require('../middleware/auth');
const router = express.Router();

// --- Server Management ---

router.get('/servers', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, sp.member_1ip, sp.member_2ip, sp.member_4ip, sp.reseller_1ip, sp.reseller_2ip, sp.reseller_4ip
      FROM Server s
      LEFT JOIN server_pricing sp ON sp.server_id = s.id
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch servers' });
  }
});

router.post('/servers', async (req, res) => {
  const { domain, auth, nama_server, ...pricing } = req.body;
  if (!domain || !auth || !nama_server) {
    return res.status(400).json({ error: "Field domain, auth, nama_server wajib diisi" });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [serverResult] = await connection.execute(
      `INSERT INTO Server (domain, auth, nama_server, location, protocols, status, batas_create_akun) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.body.location, req.body.protocols, req.body.status, req.body.batas_create_akun]
    );
    const serverId = serverResult.insertId;

    await connection.execute(
      `INSERT INTO server_pricing (server_id, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [serverId, pricing.member_1ip, pricing.member_2ip, pricing.member_4ip, pricing.reseller_1ip, pricing.reseller_2ip, pricing.reseller_4ip]
    );

    const [rows] = await connection.execute(`SELECT s.*, sp.* FROM Server s LEFT JOIN server_pricing sp ON s.id = sp.server_id WHERE s.id = ?`, [serverId]);

    await connection.commit();
    res.json(rows[0]);
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: 'Failed to create server' });
  } finally {
    if (connection) connection.release();
  }
});

router.put('/servers/:id', async (req, res) => {
    const serverId = req.params.id;
    const { domain, auth, nama_server, location, protocols, status, batas_create_akun, ...pricing } = req.body;

    if (!domain || !auth || !nama_server) {
        return res.status(400).json({ error: "Field domain, auth, nama_server wajib diisi" });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.execute(
            `UPDATE Server SET domain = ?, auth = ?, nama_server = ?, location = ?, protocols = ?, status = ?, batas_create_akun = ? WHERE id = ?`,
            [domain, auth, nama_server, location, protocols, status, batas_create_akun, serverId]
        );

        const upsertQuery = `
            INSERT INTO server_pricing (server_id, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            member_1ip = VALUES(member_1ip), member_2ip = VALUES(member_2ip), member_4ip = VALUES(member_4ip),
            reseller_1ip = VALUES(reseller_1ip), reseller_2ip = VALUES(reseller_2ip), reseller_4ip = VALUES(reseller_4ip)
        `;
        await connection.execute(upsertQuery, [serverId, pricing.member_1ip, pricing.member_2ip, pricing.member_4ip, pricing.reseller_1ip, pricing.reseller_2ip, pricing.reseller_4ip]);

        const [rows] = await connection.execute(`SELECT s.*, sp.* FROM Server s LEFT JOIN server_pricing sp ON s.id = sp.server_id WHERE s.id = ?`, [serverId]);

        await connection.commit();
        res.json(rows[0]);
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: 'Failed to update server' });
    } finally {
        if (connection) connection.release();
    }
});

router.delete('/servers/:id', async (req, res) => {
    try {
        await pool.execute("DELETE FROM Server WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Delete failed" });
    }
});

// --- User Management ---

router.get('/users', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.username, u.email, u.balance, u.is_locked, u.role, u.created_at, COUNT(bt.id) as transaction_count
            FROM users u
            LEFT JOIN balance_transactions bt ON u.id = bt.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.post('/users/:id/add-balance', async (req, res) => {
    const { amount, description } = req.body;
    const userId = req.params.id;
    const parsedAmount = parseInt(amount, 10);

    if (!parsedAmount || parsedAmount <= 0 || !description) {
        return res.status(400).json({ error: "Amount dan description valid wajib diisi." });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
        if (rows.length === 0) throw new Error('User not found');

        const balanceBefore = rows[0].balance;
        const balanceAfter = balanceBefore + parsedAmount;

        await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);
        await connection.execute(
            `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, balance_before, balance_after) VALUES (?, 'credit', ?, ?, 'admin_topup', ?, ?)`,
            [userId, parsedAmount, description, balanceBefore, balanceAfter]
        );

        await connection.commit();
        res.json({ success: true, balanceAfter });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message || 'Failed to add balance' });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/users/:id/deduct-balance', async (req, res) => {
    const { amount, description } = req.body;
    const userId = req.params.id;
    const parsedAmount = parseInt(amount, 10);

    if (!parsedAmount || parsedAmount <= 0 || !description) {
        return res.status(400).json({ error: "Amount dan description valid wajib diisi." });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
        if (rows.length === 0) throw new Error('User not found');

        const balanceBefore = rows[0].balance;
        const balanceAfter = balanceBefore - parsedAmount;

        await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);
        await connection.execute(
            `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, balance_before, balance_after) VALUES (?, 'debit', ?, ?, 'admin_deduction', ?, ?)`,
            [userId, parsedAmount, description, balanceBefore, balanceAfter]
        );

        await connection.commit();
        res.json({ success: true, balanceAfter });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ error: error.message || 'Failed to deduct balance' });
    } finally {
        if (connection) connection.release();
    }
});

router.post('/users/:id/lock', async (req, res) => {
    try {
        const [result] = await pool.execute('UPDATE users SET is_locked = 1 WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to lock user' });
    }
});

router.post('/users/:id/unlock', async (req, res) => {
    try {
        const [result] = await pool.execute('UPDATE users SET is_locked = 0 WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to unlock user' });
    }
});

router.post('/users/:id/role', async (req, res) => {
    const { role } = req.body;
    if (!role || !['member', 'reseller'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Use "member" or "reseller".' });
    }
    try {
        const [result] = await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });

        const newToken = await generateTokenForUser(req.params.id);
        res.json({ success: true, message: `User role updated to ${role}`, newToken });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update role' });
    }
});

router.get('/users/:id/transactions', async (req, res) => {
    try {
        const [rows] = await pool.execute(`SELECT * FROM balance_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`, [req.params.id, req.query.limit || 20]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// --- Cleanup ---
router.post('/cleanup', async (req, res) => {
  try {
    const result = await purgeOldRecords(); // This will be refactored in cleanupService.js
    res.status(200).json({ success: true, message: 'Database cleanup process completed successfully.', data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to execute database cleanup.', error: error.message });
  }
});

module.exports = router;
