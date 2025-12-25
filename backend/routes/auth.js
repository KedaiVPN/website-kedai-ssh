const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/connection');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const emailService = require('../services/emailService');
const router = express.Router();
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

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
    
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const existingUser = rows[0];

    if (existingUser) {
      const hasUsername = existingUser.username && existingUser.username.trim() !== '' && existingUser.username !== null;
      const isVerified = existingUser.email_verified === 1;

      if (hasUsername && isVerified) {
        return done(null, existingUser);
      } else if (hasUsername && !isVerified) {
        return done(null, { needsVerification: true, email, name, existingUserId: existingUser.id });
      } else {
        return done(null, { needsUsername: true, email, name, existingUserId: existingUser.id });
      }
    } else {
      return done(null, { needsUsername: true, email, name, isNewUser: true });
    }
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role || 'member', auth_provider: user.auth_provider },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN || '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, confirm, turnstileToken } = req.body;

    // Verify Turnstile token
    const { verifyTurnstile } = require('../utils/turnstile');
    const turnstileResult = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileResult.success) {
      return res.status(400).json({ success: false, message: 'Verifikasi captcha gagal. Silakan coba lagi.' });
    }

    if (!username || !email || !password || !confirm) {
      return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
    }

    if (password !== confirm) {
      return res.status(400).json({ success: false, message: 'Password dan konfirmasi password tidak cocok' });
    }

    const [existingUsers] = await pool.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Email atau username sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = emailService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      'INSERT INTO users (username, email, password_hash, auth_provider, email_verified, verification_token, verification_expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, 'email', 0, verificationCode, expiresAt]
    );

    await emailService.sendVerificationCode(email, verificationCode, username);

    res.status(201).json({
      success: true,
      message: 'Akun berhasil dibuat. Silakan cek email Anda untuk kode verifikasi.',
      needsVerification: true,
      email: email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, turnstileToken } = req.body;

    // Verify Turnstile token
    const { verifyTurnstile } = require('../utils/turnstile');
    const turnstileResult = await verifyTurnstile(turnstileToken, req.ip);
    if (!turnstileResult.success) {
      return res.status(400).json({ success: false, message: 'Verifikasi captcha gagal. Silakan coba lagi.' });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password harus diisi' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
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
      return res.status(403).json({ success: false, message: 'Email belum terverifikasi. Silakan cek email Anda untuk kode verifikasi.', needsVerification: true, email: user.email });
    }

    if (user.is_locked === 1) {
      return res.status(403).json({ success: false, message: 'Akun Anda telah diblokir.' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role || 'member' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

router.post('/verify-email', async (req, res) => {
  try {
    const { email, code, token, type } = req.body;

    let user;
    if (type === 'google' && token) {
      const [rows] = await pool.query('SELECT * FROM users WHERE verification_token = ? AND email = ?', [token, email]);
      user = rows[0];
    } else if (code && email) {
      const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND verification_token = ?', [email, code]);
      user = rows[0];
    } else {
      return res.status(400).json({ success: false, message: 'Parameter tidak valid' });
    }

    if (!user) {
      if (code && email) {
        await pool.query('UPDATE users SET verification_attempts = verification_attempts + 1 WHERE email = ?', [email]);
      }
      return res.status(400).json({ success: false, message: 'Kode atau token verifikasi tidak valid' });
    }

    if (new Date(user.verification_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Kode atau token verifikasi sudah expired' });
    }

    if (user.verification_attempts >= 3) {
      return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Silakan minta kode baru.' });
    }

    await pool.query('UPDATE users SET email_verified = 1, verification_token = NULL, verification_expires_at = NULL, verification_attempts = 0 WHERE id = ?', [user.id]);
    const authToken = generateToken(user);

    res.json({
      success: true,
      message: 'Email berhasil diverifikasi',
      token: authToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role || 'member' }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email harus diisi' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (user.email_verified === 1) {
      return res.status(400).json({ success: false, message: 'Email sudah terverifikasi' });
    }

    const verificationCode = emailService.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query('UPDATE users SET verification_token = ?, verification_expires_at = ?, verification_attempts = 0 WHERE email = ?', [verificationCode, expiresAt, email]);
    const emailSent = await emailService.sendVerificationCode(email, verificationCode, user.username);

    if (emailSent) {
      res.json({ success: true, message: 'Kode verifikasi baru telah dikirim ke email Anda' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal mengirim email verifikasi' });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

router.post('/google/set-username', async (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email || username.trim() === '') {
      return res.status(400).json({ success: false, message: 'Username dan email harus diisi dan username tidak boleh kosong' });
    }

    const trimmedUsername = username.trim();
    const [existingUsers] = await pool.query('SELECT * FROM users WHERE username = ?', [trimmedUsername]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan, pilih username lain' });
    }

    const [usersByEmail] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user = usersByEmail[0];

    if (user) {
      await pool.query('UPDATE users SET username = ?, updated_at = NOW() WHERE email = ?', [trimmedUsername, email]);
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (username, email, auth_provider, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [trimmedUsername, email, 'google']
      );
      const [newUsers] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      user = newUsers[0];
    }

    const [updatedUsers] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const token = generateToken(updatedUsers[0]);
    res.json({
      success: true,
      message: 'Username berhasil diset dan login berhasil',
      token,
      user: { id: updatedUsers[0].id, username: updatedUsers[0].username, email: updatedUsers[0].email, role: updatedUsers[0].role || 'member' }
    });
  } catch (error) {
    console.error('Set username error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    const newToken = generateToken(user);
    res.json({
      success: true,
      message: 'Token berhasil diperbarui',
      token: newToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role || 'member' }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ success: false, message: 'Token tidak valid atau expired' });
  }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/login?error=oauth_failed` }),
  async (req, res) => {
    const user = req.user;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    if (user.needsVerification) {
      const verificationToken = emailService.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      await pool.query('UPDATE users SET verification_token = ?, verification_expires_at = ? WHERE id = ?', [verificationToken, expiresAt, user.existingUserId]);
      const emailSent = await emailService.sendGoogleVerificationLink(user.email, verificationToken, user.name);

      if (emailSent) {
        return res.redirect(`${frontendUrl}/check-email?email=${encodeURIComponent(user.email)}&type=google`);
      } else {
        return res.redirect(`${frontendUrl}/login?error=email_failed`);
      }
    } else if (user.needsUsername) {
      const queryParams = new URLSearchParams({ email: user.email, name: user.name || '' });
      return res.redirect(`${frontendUrl}/set-username?${queryParams}`);
    } else {
      const token = generateToken(user);
      return res.redirect(`${frontendUrl}/dashboard?token=${token}`);
    }
  }
);

// -----------------------------
// Request reset password
// -----------------------------
router.post('/forgot-password', async (req, res) => {
  const { email, turnstileToken } = req.body;
  
  // Verify Turnstile token
  const { verifyTurnstile } = require('../utils/turnstile');
  const turnstileResult = await verifyTurnstile(turnstileToken, req.ip);
  if (!turnstileResult.success) {
    return res.status(400).json({ success: false, message: 'Verifikasi captcha gagal. Silakan coba lagi.' });
  }
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.json({ success: true, message: 'Jika email terdaftar, instruksi reset password telah dikirim' });
    }

    if (user.reset_attempts >= 10) {
      const lastAttempt = dayjs(user.updated_at);
      if (lastAttempt.isAfter(dayjs().subtract(1, 'hour'))) {
        return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan reset. Coba lagi dalam 1 jam' });
      }
    }

    const resetToken = uuidv4();
    console.log(`[PasswordReset] Generated token for ${email}: ${resetToken}`);

    // Simpan expired sesuai timezone server (bukan UTC)
    const expiresAt = dayjs().add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
    const attempts = user.reset_attempts >= 10 ? 1 : (user.reset_attempts || 0) + 1;

    const [updateResult] = await connection.query(
      `UPDATE users
       SET reset_token = ?, reset_token_expires_at = ?, reset_attempts = ?, updated_at = NOW()
       WHERE email = ?`,
      [resetToken, expiresAt, attempts, email]
    );

    console.log(`[PasswordReset] Database update result for ${email}: affectedRows = ${updateResult.affectedRows}`);

    const emailSent = await emailService.sendPasswordResetEmail(email, resetToken, user.username);
    if (emailSent) {
      res.json({ success: true, message: 'Instruksi reset password telah dikirim ke email Anda' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal mengirim email reset password' });
    }
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  } finally {
    if (connection) connection.release();
  }
});

// -----------------------------
// Verify reset token
// -----------------------------
router.get('/verify-reset-token', async (req, res) => {
  const { token } = req.query;
  console.log(`[PasswordReset] Received token for verification: ${token}`);

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM users WHERE reset_token = ?', [token]);
    const user = rows[0];

    console.log('[PasswordReset] Query result for token:', rows);

    if (!user || !user.reset_token_expires_at) {
      return res.status(400).json({ success: false, message: 'Token tidak valid' });
    }

    if (dayjs().isAfter(dayjs(user.reset_token_expires_at))) {
      return res.status(400).json({ success: false, message: 'Token telah kedaluwarsa' });
    }

    res.json({ success: true, message: 'Token valid', email: user.email });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  } finally {
    if (connection) connection.release();
  }
});

// -----------------------------
// Reset password
// -----------------------------
router.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Konfirmasi password tidak cocok' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query('SELECT * FROM users WHERE reset_token = ? FOR UPDATE', [token]);
    const user = rows[0];

    console.log('[PasswordReset] Reset password query result:', rows);

    if (!user || !user.reset_token_expires_at) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Token tidak valid' });
    }

    if (dayjs().isAfter(dayjs(user.reset_token_expires_at))) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Token telah kedaluwarsa' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await connection.query(
      `UPDATE users
       SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL, reset_attempts = 0, updated_at = NOW()
       WHERE id = ?`,
      [hashedPassword, user.id]
    );

    await connection.commit();
    res.json({ success: true, message: 'Password berhasil direset. Silakan login dengan password baru' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
