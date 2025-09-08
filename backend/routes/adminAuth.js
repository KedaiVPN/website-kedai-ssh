
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Database path
const dbPath = path.join(__dirname, '..', 'db', 'database.sqlite');

// Middleware to verify admin token
const verifyAdminToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access token required'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, admin) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.admin = admin;
    next();
  });
};

// Check if admin setup is needed (first time access)
router.post('/check-setup', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  
  db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    res.json({
      success: true,
      needsSetup: row.count === 0
    });
  });

  db.close();
});

// Register first admin (only if no admin exists)
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, dan password wajib diisi'
    });
  }

  const db = new sqlite3.Database(dbPath);

  try {
    // Check if any admin already exists
    const checkAdmin = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (checkAdmin > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin sudah terdaftar'
      });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new admin
    db.run(
      'INSERT INTO admins (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, passwordHash],
      function(err) {
        if (err) {
          console.error('Error creating admin:', err);
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({
              success: false,
              message: 'Username atau email sudah digunakan'
            });
          }
          return res.status(500).json({
            success: false,
            message: 'Gagal membuat akun admin'
          });
        }

        // Generate JWT token
        const token = jwt.sign({
          id: this.lastID,
          username,
          email
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
          success: true,
          message: 'Admin berhasil didaftarkan',
          token,
          admin: {
            id: this.lastID,
            username,
            email
          }
        });
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mendaftarkan admin'
    });
  } finally {
    db.close();
  }
});

// Login admin
router.post('/login', (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email/username dan password wajib diisi'
    });
  }

  const db = new sqlite3.Database(dbPath);

  // Check if identifier is email or username
  const query = 'SELECT * FROM admins WHERE email = ? OR username = ?';
  
  db.get(query, [identifier, identifier], async (err, admin) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Email/username atau password salah'
      });
    }

    try {
      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Email/username atau password salah'
        });
      }

      // Generate JWT token
      const token = jwt.sign({
        id: admin.id,
        username: admin.username,
        email: admin.email
      }, JWT_SECRET, { expiresIn: '24h' });

      res.json({
        success: true,
        message: 'Login berhasil',
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal login'
      });
    }
  });

  db.close();
});

// Get current admin info
router.get('/me', verifyAdminToken, (req, res) => {
  const db = new sqlite3.Database(dbPath);

  db.get('SELECT id, username, email, created_at FROM admins WHERE id = ?', [req.admin.id], (err, admin) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin tidak ditemukan'
      });
    }

    res.json({
      success: true,
      admin
    });
  });

  db.close();
});

// Logout (client-side will remove token)
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout berhasil'
  });
});

module.exports = { router, verifyAdminToken };
