
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const router = express.Router();

const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// Check if admin setup is required (no admins exist)
router.get('/check-setup', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM admins', [], (err, row) => {
    if (err) {
      console.error('Error checking admin setup:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const requiresSetup = row.count === 0;
    res.json({ requiresSetup });
  });
});

// Register first admin (only works if no admins exist)
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, dan password wajib diisi' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password minimal 6 karakter' });
  }

  try {
    // Check if any admin already exists
    db.get('SELECT COUNT(*) as count FROM admins', [], async (err, row) => {
      if (err) {
        console.error('Error checking existing admins:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (row.count > 0) {
        return res.status(400).json({ error: 'Admin sudah terdaftar. Silakan login.' });
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
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Username atau email sudah digunakan' });
            }
            return res.status(500).json({ error: 'Gagal membuat akun admin' });
          }

          res.json({
            success: true,
            message: 'Admin berhasil didaftarkan',
            admin: {
              id: this.lastID,
              username,
              email
            }
          });
        }
      );
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login admin
router.post('/login', (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/username dan password wajib diisi' });
  }

  // Find admin by email or username
  db.get(
    'SELECT * FROM admins WHERE email = ? OR username = ?',
    [identifier, identifier],
    async (err, admin) => {
      if (err) {
        console.error('Error finding admin:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!admin) {
        return res.status(401).json({ error: 'Email/username atau password salah' });
      }

      try {
        // Verify password
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Email/username atau password salah' });
        }

        // Return success with admin data (without password hash)
        res.json({
          success: true,
          message: 'Login berhasil',
          admin: {
            id: admin.id,
            username: admin.username,
            email: admin.email
          }
        });
      } catch (error) {
        console.error('Error verifying password:', error);
        res.status(500).json({ error: 'Server error' });
      }
    }
  );
});

// Get current admin info (for maintaining session)
router.get('/me', (req, res) => {
  const adminId = req.headers['x-admin-id']; // Simple auth check

  if (!adminId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.get('SELECT id, username, email FROM admins WHERE id = ?', [adminId], (err, admin) => {
    if (err) {
      console.error('Error fetching admin:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json({ admin });
  });
});

module.exports = router;
