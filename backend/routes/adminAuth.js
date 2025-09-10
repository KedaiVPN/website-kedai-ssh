const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    req.admin = admin;
    next();
  });
};

router.post('/check-setup', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM admins');
    res.json({ success: true, needsSetup: rows[0].count === 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Username, email, dan password wajib diisi' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM admins FOR UPDATE');
    if (rows[0].count > 0) {
      await connection.commit(); // No changes, but end transaction
      return res.status(400).json({ success: false, message: 'Admin sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );
    const adminId = result.insertId;

    await connection.commit();

    const token = jwt.sign({ id: adminId, username, email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      success: true, message: 'Admin berhasil didaftarkan', token,
      admin: { id: adminId, username, email }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Username atau email sudah digunakan' });
    }
    res.status(500).json({ success: false, message: 'Gagal membuat akun admin' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Email/username dan password wajib diisi' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE email = ? OR username = ?', [identifier, identifier]);
    const admin = rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.status(401).json({ success: false, message: 'Email/username atau password salah' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username, email: admin.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      success: true, message: 'Login berhasil', token,
      admin: { id: admin.id, username: admin.username, email: admin.email }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Gagal login' });
  }
});

router.get('/me', verifyAdminToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, username, email, created_at FROM admins WHERE id = ?', [req.admin.id]);
    const admin = rows[0];
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' });
    }
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout berhasil' });
});

module.exports = { router, verifyAdminToken };
