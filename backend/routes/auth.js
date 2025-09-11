const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const emailService = require('../services/emailService');
const pool = require('../db/connection');
const { generateToken } = require('../middleware/auth'); // Import centralized token generator
const router = express.Router();

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

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const existingUser = rows[0];

    if (existingUser) {
      const hasUsername = !!existingUser.username;
      const isVerified = existingUser.email_verified === 1;

      if (hasUsername && isVerified) {
        return done(null, existingUser);
      } else {
        return done(null, { needsCompletion: true, existingUserId: existingUser.id, email, name });
      }
    } else {
      const [result] = await pool.execute(
        'INSERT INTO users (email, auth_provider, email_verified) VALUES (?, ?, ?)',
        [email, 'google', 1]
      );
      return done(null, { needsCompletion: true, existingUserId: result.insertId, email, name });
    }
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Register endpoint
router.post('/register', async (req, res) => {
  const { username, email, password, confirm } = req.body;
  if (!username || !email || !password || !confirm) {
    return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
  }
  if (password !== confirm) {
    return res.status(400).json({ success: false, message: 'Password dan konfirmasi password tidak cocok' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute('SELECT email, username FROM users WHERE email = ? OR username = ? FOR UPDATE', [email, username]);
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Email atau username sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = emailService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await connection.execute(
      'INSERT INTO users (username, email, password_hash, auth_provider, email_verified, verification_token, verification_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, 'email', 0, verificationCode, expiresAt]
    );

    await emailService.sendVerificationCode(email, verificationCode, username);
    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Akun berhasil dibuat. Silakan cek email Anda untuk kode verifikasi.',
      needsVerification: true,
      email: email
    });
  } catch (error) {
    if (connection) await connection.rollback();
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat registrasi' });
  } finally {
    if (connection) connection.release();
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan password harus diisi' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }
    if (!user.password_hash) {
      return res.status(401).json({ success: false, message: 'Akun ini terdaftar menggunakan Google. Silakan login dengan Google.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    if (user.email_verified === 0) {
      return res.status(403).json({
        success: false,
        message: 'Email belum terverifikasi. Silakan cek email Anda.',
        needsVerification: true,
        email: user.email
      });
    }

    const token = generateToken(user);
    res.json({
      success: true, message: 'Login berhasil', token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role || 'member' }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat login' });
  }
});

// Email verification endpoint
router.post('/verify-email', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ success: false, message: 'Email dan kode verifikasi diperlukan' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ? AND verification_token = ? FOR UPDATE', [email, code]);
        const user = rows[0];

        if (!user) {
            await connection.execute('UPDATE users SET verification_attempts = verification_attempts + 1 WHERE email = ?', [email]);
            await connection.commit();
            return res.status(400).json({ success: false, message: 'Kode verifikasi tidak valid' });
        }

        if (new Date(user.verification_expires_at) < new Date()) {
            await connection.commit();
            return res.status(400).json({ success: false, message: 'Kode verifikasi sudah kedaluwarsa' });
        }

        if (user.verification_attempts >= 5) {
            await connection.commit();
            return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Silakan minta kode baru.' });
        }

        await connection.execute(
            'UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL, verification_attempts = 0 WHERE id = ?',
            [user.id]
        );

        await connection.commit();

        const token = generateToken(user);
        res.json({
            success: true, message: 'Email berhasil diverifikasi', token,
            user: { id: user.id, username: user.username, email: user.email, role: user.role || 'member' }
        });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server saat verifikasi' });
    } finally {
        if (connection) connection.release();
    }
});

// Resend verification endpoint
router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ success: false, message: 'Email harus diisi' });
    }

    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }
        if (user.email_verified === 1) {
            return res.status(400).json({ success: false, message: 'Email sudah terverifikasi' });
        }

        const verificationCode = emailService.generateVerificationCode();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await pool.execute(
            'UPDATE users SET verification_token = ?, verification_expires_at = ?, verification_attempts = 0 WHERE email = ?',
            [verificationCode, expiresAt, email]
        );

        await emailService.sendVerificationCode(email, verificationCode, user.username);
        res.json({ success: true, message: 'Kode verifikasi baru telah dikirim' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengirim ulang kode verifikasi' });
    }
});

// Google OAuth set username endpoint
router.post('/google/set-username', async (req, res) => {
    const { username, userId } = req.body;
    if (!username || !userId) {
        return res.status(400).json({ success: false, message: 'Username dan userId diperlukan' });
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existing] = await connection.execute('SELECT id FROM users WHERE username = ? FOR UPDATE', [username]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
        }

        await connection.execute('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
        const [userRows] = await connection.execute('SELECT * FROM users WHERE id = ?', [userId]);
        await connection.commit();

        const updatedUser = userRows[0];
        const token = generateToken(updatedUser);
        res.json({
            success: true, message: 'Username berhasil diatur', token,
            user: { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email, role: updatedUser.role || 'member' }
        });
    } catch (error) {
        if (connection) await connection.rollback();
        res.status(500).json({ success: false, message: 'Gagal mengatur username' });
    } finally {
        if (connection) connection.release();
    }
});

// Refresh token endpoint
router.post('/refresh-token', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    try {
        const { jwtSecret } = require('../config');
        const decoded = jwt.verify(token, jwtSecret, { ignoreExpiration: true });
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [decoded.id]);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        const newToken = generateToken(user);
        res.json({
            success: true, token: newToken,
            user: { id: user.id, username: user.username, email: user.email, role: user.role || 'member' }
        });
    } catch (error) {
        res.status(403).json({ success: false, message: 'Token tidak valid' });
    }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login?error=oauth_failed`,
    session: false
  }),
  (req, res) => {
    const user = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    if (user.needsCompletion) {
      const queryParams = new URLSearchParams({
        userId: user.existingUserId,
        email: user.email,
        name: user.name || ''
      });
      res.redirect(`${frontendUrl}/set-username?${queryParams.toString()}`);
    } else {
      const token = generateToken(user);
      res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }
  }
);

module.exports = router;
