const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const emailService = require('../services/emailService');
const router = express.Router();

const dbPath = path.join(__dirname, '../db/database.sqlite');
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
    
    console.log('=== Google OAuth Strategy Start ===');
    console.log('Profile email:', email);
    console.log('Profile name:', name);
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, existingUser) => {
      if (err) {
        console.error('Database error in Google OAuth:', err);
        return done(err, null);
      }

      console.log('Existing user found:', existingUser);

      if (existingUser) {
        // User exists - check if they have a complete profile and are verified
        const hasUsername = existingUser.username && existingUser.username.trim() !== '' && existingUser.username !== null;
        const isVerified = existingUser.email_verified === 1;
        
        console.log('User has valid username:', hasUsername);
        console.log('User is verified:', isVerified);
        console.log('Username value:', existingUser.username);
        
        if (hasUsername && isVerified) {
          console.log('User has complete profile and is verified, proceeding with login');
          return done(null, existingUser);
        } else if (hasUsername && !isVerified) {
          console.log('User has username but needs email verification');
          return done(null, { needsVerification: true, email, name, existingUserId: existingUser.id });
        } else {
          console.log('User exists but needs username');
          return done(null, { needsUsername: true, email, name, existingUserId: existingUser.id });
        }
      } else {
        console.log('New user, needs to set username and verify email');
        return done(null, { needsUsername: true, email, name, isNewUser: true });
      }
    });
  } catch (error) {
    console.error('Google OAuth strategy error:', error);
    return done(error, null);
  }
}));

// Passport session serialization
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user);
  done(null, user);
});

passport.deserializeUser((user, done) => {
  console.log('Deserializing user:', user);
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

// Register endpoint - Updated with email verification
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
        
        // Generate verification code
        const verificationCode = emailService.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

        // Insert new user with email_verified = false
        db.run(
          'INSERT INTO users (username, email, password_hash, auth_provider, email_verified, verification_token, verification_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [username, email, hashedPassword, 'email', 0, verificationCode, expiresAt],
          async function(err) {
            if (err) {
              console.error('Insert error:', err);
              return res.status(500).json({
                success: false,
                message: 'Gagal membuat akun'
              });
            }

            // Send verification email
            const emailSent = await emailService.sendVerificationCode(email, verificationCode, username);
            
            if (!emailSent) {
              console.error('Failed to send verification email');
              // Don't fail registration, just log the error
            }

            res.status(201).json({
              success: true,
              message: 'Akun berhasil dibuat. Silakan cek email Anda untuk kode verifikasi.',
              needsVerification: true,
              email: email
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

// Login endpoint - Updated with email verification check
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

        // Check email verification
        if (user.email_verified === 0) {
          return res.status(403).json({
            success: false,
            message: 'Email belum terverifikasi. Silakan cek email Anda untuk kode verifikasi.',
            needsVerification: true,
            email: user.email
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

// Email verification endpoint - NEW
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code, token, type } = req.body;

    if (type === 'google' && token) {
      // Handle Google verification via token
      db.get('SELECT * FROM users WHERE verification_token = ? AND email = ?', [token, email], (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan database'
          });
        }

        if (!user) {
          return res.status(400).json({
            success: false,
            message: 'Token verifikasi tidak valid'
          });
        }

        // Check token expiry
        if (new Date(user.verification_expires_at) < new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Token verifikasi sudah expired'
          });
        }

        // Update user as verified
        db.run('UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL WHERE id = ?', [user.id], function(err) {
          if (err) {
            console.error('Update error:', err);
            return res.status(500).json({
              success: false,
              message: 'Gagal memverifikasi email'
            });
          }

          const authToken = generateToken(user);
          
          res.json({
            success: true,
            message: 'Email berhasil diverifikasi',
            token: authToken,
            user: {
              id: user.id,
              username: user.username,
              email: user.email
            }
          });
        });
      });
    } else if (code && email) {
      // Handle email verification via code
      db.get('SELECT * FROM users WHERE email = ? AND verification_token = ?', [email, code], (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan database'
          });
        }

        if (!user) {
          // Increment failed attempts
          db.run('UPDATE users SET verification_attempts = verification_attempts + 1 WHERE email = ?', [email]);
          
          return res.status(400).json({
            success: false,
            message: 'Kode verifikasi tidak valid'
          });
        }

        // Check token expiry
        if (new Date(user.verification_expires_at) < new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Kode verifikasi sudah expired'
          });
        }

        // Check attempts limit
        if (user.verification_attempts >= 3) {
          return res.status(429).json({
            success: false,
            message: 'Terlalu banyak percobaan. Silakan minta kode baru.'
          });
        }

        // Update user as verified
        db.run('UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL, verification_attempts = 0 WHERE id = ?', [user.id], function(err) {
          if (err) {
            console.error('Update error:', err);
            return res.status(500).json({
              success: false,
              message: 'Gagal memverifikasi email'
            });
          }

          const token = generateToken(user);
          
          res.json({
            success: true,
            message: 'Email berhasil diverifikasi',
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email
            }
          });
        });
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Parameter tidak valid'
      });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Resend verification endpoint - NEW
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email harus diisi'
      });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan database'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      if (user.email_verified === 1) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terverifikasi'
        });
      }

      // Generate new verification code
      const verificationCode = emailService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // Update verification token
      db.run('UPDATE users SET verification_token = ?, verification_expires_at = ?, verification_attempts = 0 WHERE email = ?', 
        [verificationCode, expiresAt, email], async function(err) {
        if (err) {
          console.error('Update error:', err);
          return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui token verifikasi'
          });
        }

        // Send verification email
        const emailSent = await emailService.sendVerificationCode(email, verificationCode, user.username);
        
        if (emailSent) {
          res.json({
            success: true,
            message: 'Kode verifikasi baru telah dikirim ke email Anda'
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Gagal mengirim email verifikasi'
          });
        }
      });
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Google OAuth set username endpoint - IMPROVED
router.post('/google/set-username', async (req, res) => {
  try {
    const { username, email } = req.body;

    console.log('=== Set Username Request ===');
    console.log('Username:', username);
    console.log('Email:', email);

    if (!username || !email || username.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Username dan email harus diisi dan username tidak boleh kosong'
      });
    }

    const trimmedUsername = username.trim();

    // Check if username already exists
    db.get('SELECT * FROM users WHERE username = ?', [trimmedUsername], (err, existingUser) => {
      if (err) {
        console.error('Database error checking username:', err);
        return res.status(500).json({
          success: false,
          message: 'Terjadi kesalahan database saat mengecek username'
        });
      }

      if (existingUser) {
        console.log('Username already taken:', trimmedUsername);
        return res.status(400).json({
          success: false,
          message: 'Username sudah digunakan, pilih username lain'
        });
      }

      // Check if user exists by email
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
          console.error('Database error finding user by email:', err);
          return res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan database saat mencari user'
          });
        }

        if (user) {
          console.log('Updating existing user with username:', user.id);
          // Update existing user's username
          db.run('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?', [trimmedUsername, email], function(err) {
            if (err) {
              console.error('Update error:', err);
              return res.status(500).json({
                success: false,
                message: 'Gagal mengupdate username'
              });
            }

            console.log('User updated successfully, rows affected:', this.changes);

            // Get updated user
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, updatedUser) => {
              if (err || !updatedUser) {
                console.error('Error getting updated user:', err);
                return res.status(500).json({
                  success: false,
                  message: 'Gagal mengambil data user setelah update'
                });
              }

              const token = generateToken(updatedUser);
              console.log('Successfully updated user and generated token');
              
              res.json({
                success: true,
                message: 'Username berhasil diset dan login berhasil',
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
          console.log('Creating new user for Google OAuth');
          // Create new user for Google OAuth
          db.run(
            'INSERT INTO users (username, email, auth_provider, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [trimmedUsername, email, 'google'],
            function(err) {
              if (err) {
                console.error('Insert error:', err);
                return res.status(500).json({
                  success: false,
                  message: 'Gagal membuat akun baru'
                });
              }

              console.log('New user created with ID:', this.lastID);

              // Get the created user
              db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
                if (err || !newUser) {
                  console.error('Error getting new user:', err);
                  return res.status(500).json({
                    success: false,
                    message: 'Gagal mengambil data user baru'
                  });
                }

                const token = generateToken(newUser);
                console.log('Successfully created new user and generated token');
                
                res.status(201).json({
                  success: true,
                  message: 'Akun berhasil dibuat dan login berhasil',
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

// Google OAuth routes - IMPROVED
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login?error=oauth_failed` }),
  async (req, res) => {
    const user = req.user;
    console.log('=== Google OAuth Callback ===');
    console.log('Callback user:', user);
    
    if (user.needsVerification) {
      console.log('User needs email verification, sending verification email');
      
      // Generate verification token for Google user
      const verificationToken = emailService.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      // Update user with verification token
      db.run('UPDATE users SET verification_token = ?, verification_expires_at = ? WHERE id = ?', 
        [verificationToken, expiresAt, user.existingUserId], async (err) => {
        if (err) {
          console.error('Error updating verification token:', err);
          return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:8080'}/login?error=verification_failed`);
        }

        // Send verification email
        const emailSent = await emailService.sendGoogleVerificationLink(user.email, verificationToken, user.name);
        
        if (emailSent) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
          return res.redirect(`${frontendUrl}/check-email?email=${encodeURIComponent(user.email)}&type=google`);
        } else {
          return res.redirect(`${frontendUrl}/login?error=email_failed`);
        }
      });
    } else if (user.needsUsername) {
      console.log('User needs username, redirecting to set username page');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const queryParams = new URLSearchParams({
        email: user.email,
        name: user.name || ''
      });
      return res.redirect(`${frontendUrl}/set-username?${queryParams}`);
    } else {
      console.log('User has complete profile and is verified, generating token and redirecting');
      const token = generateToken(user);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      return res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }
  }
);

module.exports = router;
