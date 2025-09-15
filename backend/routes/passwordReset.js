const express = require('express');
const pool = require('../db/connection');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const dayjs = require('dayjs');
const router = express.Router();

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
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
    const expiresAt = dayjs().add(1, 'hour').toISOString().slice(0, 19).replace('T', ' ');
    const attempts = user.reset_attempts >= 10 ? 1 : (user.reset_attempts || 0) + 1;

    await pool.query(
      `UPDATE users SET reset_token = ?, reset_token_expires_at = ?, reset_attempts = ?, updated_at = NOW() WHERE email = ?`,
      [resetToken, expiresAt, attempts, email]
    );

    const emailSent = await emailService.sendPasswordResetEmail(email, resetToken, user.username);
    if (emailSent) {
      res.json({ success: true, message: 'Instruksi reset password telah dikirim ke email Anda' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal mengirim email reset password' });
    }
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

router.get('/verify-reset-token', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE reset_token = ?', [token]);
    const user = rows[0];

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
  }
});

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

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE reset_token = ?', [token]);
    const user = rows[0];

    if (!user || !user.reset_token_expires_at) {
      return res.status(400).json({ success: false, message: 'Token tidak valid' });
    }

    if (dayjs().isAfter(dayjs(user.reset_token_expires_at))) {
      return res.status(400).json({ success: false, message: 'Token telah kedaluwarsa' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await pool.query(
      `UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL, reset_attempts = 0, updated_at = NOW() WHERE id = ?`,
      [hashedPassword, user.id]
    );

    res.json({ success: true, message: 'Password berhasil direset. Silakan login dengan password baru' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
