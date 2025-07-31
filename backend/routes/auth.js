const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const router = express.Router();

const dbPath = path.join(__dirname, '../db/sellvpn.db');
const db = new sqlite3.Database(dbPath);

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, existingUser) => {
      if (err) {
        return done(err, null);
      }

      if (existingUser) {
        // User exists, check if they have a username
        if (existingUser.username) {
          return done(null, existingUser);
        } else {
          // User exists but no username, needs to set username
          return done(null, { needsUsername: true, email, name });
        }
      } else {
        // New user, needs to set username
        return done(null, { needsUsername: true, email, name });
      }
    });
  } catch (error) {
    return done(error, null);
  }
}));

// Passport session serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Helper function to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      auth_provider: user.auth_provider 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirm } = req.body;

    if (!username || !email || !password || !confirm) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi'
      });
    }

    if (password !== confirm) {
      return res.status(400).json({
        success: false,
        message: 'Password dan konfirmasi password tidak cocok'
      });
    }

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, existingUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan database'
        });
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email atau username sudah terdaftar'
        });
      }

      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        db.run(
          'INSERT INTO users (username, email, password_hash, auth_provider) VALUES (?, ?, ?, ?)',
          [username, email, hashedPassword, 'email'],
          function(err) {
            if (err) {
              console.error('Insert error:', err);
              return res.status(500).json({
                success: false,
                message: 'Gagal membuat akun'
              });
            }

            // Get the created user
            db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, user) => {
              if (err || !user) {
                return res.status(500).json({
                  success: false,
                  message: 'Gagal mengambil data user'
                });
              }

              const token = generateToken(user);
              
              res.status(201).json({
                success: true,
                message: 'Akun berhasil dibuat',
                token,
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email
                }
              });
            });
          }
        );
      } catch (hashError) {
        console.error('Hash error:', hashError);
        return res.status(500).json({
          success: false,
          message: 'Gagal memproses password'
        });
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi'
      });
    }

    // Find user by email
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan database'
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email atau password salah'
        });
      }

      // Check if user has password (not Google OAuth user)
      if (!user.password_hash) {
        return res.status(401).json({
          success: false,
          message: 'Akun ini terdaftar menggunakan Google. Silakan login dengan Google.'
        });
      }

      try {
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            message: 'Email atau password salah'
          });
        }

        const token = generateToken(user);

        res.json({
          success: true,
          message: 'Login berhasil',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      } catch (compareError) {
        console.error('Password compare error:', compareError);
        return res.status(500).json({
          success: false,
          message: 'Gagal memverifikasi password'
        });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Google OAuth set username endpoint
router.post('/google/set-username', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username dan email harus diisi'
      });
    }

    // Check if username already exists
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, existingUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan database'
        });
      }

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username sudah digunakan'
        });
      }

      // Check if user exists by email (from Google OAuth)
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan database'
          });
        }

        if (user) {
          // Update existing user's username
          db.run('UPDATE users SET username = ? WHERE email = ?', [username, email], function(err) {
            if (err) {
              console.error('Update error:', err);
              return res.status(500).json({
                success: false,
                message: 'Gagal mengupdate username'
              });
            }

            // Get updated user
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, updatedUser) => {
              if (err || !updatedUser) {
                return res.status(500).json({
                  success: false,
                  message: 'Gagal mengambil data user'
                });
              }

              const token = generateToken(updatedUser);
              
              res.json({
                success: true,
                message: 'Username berhasil diset',
                token,
                user: {
                  id: updatedUser.id,
                  username: updatedUser.username,
                  email: updatedUser.email
                }
              });
            });
          });
        } else {
          // Create new user for Google OAuth
          db.run(
            'INSERT INTO users (username, email, auth_provider) VALUES (?, ?, ?)',
            [username, email, 'google'],
            function(err) {
              if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({
                  success: false,
                  message: 'Gagal membuat akun'
                });
              }

              // Get the created user
              db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
                if (err || !newUser) {
                  return res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil data user'
                  });
                }

                const token = generateToken(newUser);
                
                res.status(201).json({
                  success: true,
                  message: 'Akun berhasil dibuat',
                  token,
                  user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email
                  }
                });
              });
            }
          );
        }
      });
    });
  } catch (error) {
    console.error('Set username error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login?error=oauth_failed` }),
  (req, res) => {
    const user = req.user;
    
    if (user.needsUsername) {
      // Redirect to set username page with email in query params
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      return res.redirect(`${frontendUrl}/set-username?email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || '')}`);
    } else {
      // User has complete profile, generate token and redirect to dashboard
      const token = generateToken(user);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      return res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }
  }
);

module.exports = router;