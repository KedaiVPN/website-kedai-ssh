const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const router = express.Router();
const { JWT_SECRET } = require('../config');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    req.admin = admin;
    next();
  });
};

// Check if admin setup is needed
router.post('/check-setup', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM admins');
    res.json({ success: true, needsSetup: rows[0].count === 0 });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Register first admin
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: 'Username, email, dan password wajib diisi' });
  }

  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM admins');
    if (rows[0].count > 0) {
      return res.status(400).json({ success: false, message: 'Admin sudah terdaftar' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const [result] = await pool.query(
      'INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash]
    );

    const adminId = result.insertId;
    const token = jwt.sign({ id: adminId, username, email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Admin berhasil didaftarkan',
      token,
      admin: { id: adminId, username, email }
    });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Username atau email sudah digunakan' });
    }
    res.status(500).json({ success: false, message: 'Gagal membuat akun admin' });
  }
});

// Login admin
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ success: false, message: 'Email/username dan password wajib diisi' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ? OR username = ?', [identifier, identifier]);
    const admin = rows[0];

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Email/username atau password salah' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Email/username atau password salah' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username, email: admin.email }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      admin: { id: admin.id, username: admin.username, email: admin.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Gagal login' });
  }
});

// Get current admin info
router.get('/me', verifyAdminToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, created_at FROM admins WHERE id = ?', [req.admin.id]);
    const admin = rows[0];

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin tidak ditemukan' });
    }

    res.json({ success: true, admin });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logout berhasil' });
});

module.exports = { router, verifyAdminToken };
