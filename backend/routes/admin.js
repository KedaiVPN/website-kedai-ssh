const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// Ensure server_pricing table exists for per-server pricing
db.run(`
  CREATE TABLE IF NOT EXISTS server_pricing (
    server_id INTEGER PRIMARY KEY,
    member_1ip INTEGER DEFAULT 330,
    member_2ip INTEGER DEFAULT 430,
    member_4ip INTEGER DEFAULT 600,
    reseller_1ip INTEGER DEFAULT 165,
    reseller_2ip INTEGER DEFAULT 215,
    reseller_4ip INTEGER DEFAULT 300,
    FOREIGN KEY (server_id) REFERENCES Server(id) ON DELETE CASCADE
  )
`);

// Get all servers (including pricing)
router.get('/servers', (req, res) => {
  db.all(`
    SELECT s.*, sp.member_1ip, sp.member_2ip, sp.member_4ip, sp.reseller_1ip, sp.reseller_2ip, sp.reseller_4ip
    FROM Server s
    LEFT JOIN server_pricing sp ON sp.server_id = s.id
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(rows);
  });
});

// Add new server
router.post('/servers', (req, res) => {
  const {
    domain,
    auth,
    nama_server,
    location = 'Unknown',
    protocols = 'ssh,vmess,vless,trojan',
    status = 'online',
    batas_create_akun = 1000,
    // pricing fields
    member_1ip = 330,
    member_2ip = 430,
    member_4ip = 600,
    reseller_1ip = 165,
    reseller_2ip = 215,
    reseller_4ip = 300
  } = req.body;

  if (!domain || !auth || !nama_server) {
    return res.status(400).json({ error: "Field domain, auth, nama_server wajib diisi" });
  }

  db.run(
    `INSERT INTO Server (
      domain, auth, nama_server, location, protocols, status, batas_create_akun
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [domain, auth, nama_server, location, protocols, status, batas_create_akun],
    function (err) {
      if (err) return res.status(500).json({ error: "Insert failed" });

      const serverId = this.lastID;

      // Insert pricing for this server
      db.run(
        `INSERT INTO server_pricing (
          server_id, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [serverId, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip],
        function (err2) {
          if (err2) return res.status(500).json({ error: "Insert pricing failed" });

          // Return the created server with pricing
          db.get(
            `SELECT s.*, sp.member_1ip, sp.member_2ip, sp.member_4ip, sp.reseller_1ip, sp.reseller_2ip, sp.reseller_4ip
             FROM Server s
             LEFT JOIN server_pricing sp ON sp.server_id = s.id
             WHERE s.id = ?`,
            [serverId],
            (err3, row) => {
              if (err3) return res.status(500).json({ error: "Fetch created server failed" });
              res.json(row);
            }
          );
        }
      );
    }
  );
});

// Edit server by ID
router.put('/servers/:id', (req, res) => {
  const {
    domain,
    auth,
    nama_server,
    location,
    protocols,
    status,
    batas_create_akun,
    // pricing fields
    member_1ip,
    member_2ip,
    member_4ip,
    reseller_1ip,
    reseller_2ip,
    reseller_4ip
  } = req.body;

  if (!domain || !auth || !nama_server) {
    return res.status(400).json({ error: "Field domain, auth, nama_server wajib diisi" });
  }

  db.run(
    `UPDATE Server SET
      domain = ?,
      auth = ?,
      nama_server = ?,
      location = ?,
      protocols = ?,
      status = ?,
      batas_create_akun = ?
     WHERE id = ?`,
    [domain, auth, nama_server, location, protocols, status, batas_create_akun, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Update failed" });

      // Upsert pricing for this server
      db.run(
        `INSERT INTO server_pricing (
          server_id, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(server_id) DO UPDATE SET
          member_1ip = excluded.member_1ip,
          member_2ip = excluded.member_2ip,
          member_4ip = excluded.member_4ip,
          reseller_1ip = excluded.reseller_1ip,
          reseller_2ip = excluded.reseller_2ip,
          reseller_4ip = excluded.reseller_4ip`,
        [req.params.id, member_1ip, member_2ip, member_4ip, reseller_1ip, reseller_2ip, reseller_4ip],
        function (err2) {
          if (err2) return res.status(500).json({ error: "Update pricing failed" });

          // Return updated server with pricing
          db.get(
            `SELECT s.*, sp.member_1ip, sp.member_2ip, sp.member_4ip, sp.reseller_1ip, sp.reseller_2ip, sp.reseller_4ip
             FROM Server s
             LEFT JOIN server_pricing sp ON sp.server_id = s.id
             WHERE s.id = ?`,
            [req.params.id],
            (err3, row) => {
              if (err3) return res.status(500).json({ error: "Fetch updated server failed" });
              res.json(row);
            }
          );
        }
      );
    }
  );
});

// Delete server by ID
router.delete('/servers/:id', (req, res) => {
  db.run("DELETE FROM Server WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.json({ success: true });
  });
});

// Get all users with balance, role and transaction info
router.get('/users', (req, res) => {
  const query = `
    SELECT 
      u.id,
      u.username,
      u.email,
      u.balance,
      u.is_locked,
      u.role,
      u.created_at,
      COALESCE(t.transaction_count, 0) as transaction_count
    FROM users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) as transaction_count 
      FROM balance_transactions 
      GROUP BY user_id
    ) t ON u.id = t.user_id
    ORDER BY u.created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: "Failed to fetch users" });
    }
    res.json(rows);
  });
});

// Add balance to user
router.post('/users/:id/add-balance', (req, res) => {
  const { amount, description } = req.body;
  const userId = req.params.id;

  if (!amount || amount <= 0 || !description) {
    return res.status(400).json({ error: "Amount dan description wajib diisi" });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Get current balance
    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
      if (err || !row) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      const balanceBefore = row.balance || 0;
      const balanceAfter = balanceBefore + parseInt(amount);

      // Update user balance
      db.run('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to update balance' });
        }

        // Record transaction
        db.run(`
          INSERT INTO balance_transactions 
          (user_id, type, amount, description, reference_type, balance_before, balance_after)
          VALUES (?, 'credit', ?, ?, 'admin_topup', ?, ?)
        `, [userId, amount, description, balanceBefore, balanceAfter], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to record transaction' });
          }

          db.run('COMMIT');
          res.json({
            success: true,
            balanceBefore,
            balanceAfter,
            amount: parseInt(amount)
          });
        });
      });
    });
  });
});

// Deduct balance from user
router.post('/users/:id/deduct-balance', (req, res) => {
  const { amount, description } = req.body;
  const userId = req.params.id;

  if (!amount || amount <= 0 || !description) {
    return res.status(400).json({ error: "Amount dan description wajib diisi" });
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Get current balance
    db.get('SELECT balance FROM users WHERE id = ?', [userId], (err, row) => {
      if (err || !row) {
        db.run('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      const balanceBefore = row.balance || 0;
      const balanceAfter = balanceBefore - parseInt(amount);

      // Update user balance (allow negative balance for admin actions)
      db.run('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to update balance' });
        }

        // Record transaction
        db.run(`
          INSERT INTO balance_transactions 
          (user_id, type, amount, description, reference_type, balance_before, balance_after)
          VALUES (?, 'debit', ?, ?, 'admin_deduction', ?, ?)
        `, [userId, amount, description, balanceBefore, balanceAfter], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Failed to record transaction' });
          }

          db.run('COMMIT');
          res.json({
            success: true,
            balanceBefore,
            balanceAfter,
            amount: parseInt(amount)
          });
        });
      });
    });
  });
});

// Lock user
router.post('/users/:id/lock', (req, res) => {
  const userId = req.params.id;

  db.run('UPDATE users SET is_locked = 1 WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to lock user' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User locked successfully' });
  });
});

// Unlock user
router.post('/users/:id/unlock', (req, res) => {
  const userId = req.params.id;

  db.run('UPDATE users SET is_locked = 0 WHERE id = ?', [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to unlock user' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User unlocked successfully' });
  });
});

// Update user role (member <-> reseller)
router.post('/users/:id/role', (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role || !['member', 'reseller'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Use "member" or "reseller".' });
  }

  db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update user role' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: `User role updated to ${role}` });
  });
});

// Get user transaction history
router.get('/users/:id/transactions', (req, res) => {
  const userId = req.params.id;
  const limit = req.query.limit || 20;

  db.all(`
    SELECT * FROM balance_transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ?
  `, [userId, limit], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch transactions' });
    }
    res.json(rows);
  });
});

module.exports = router;
