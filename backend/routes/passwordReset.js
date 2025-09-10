const express = require('express');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const dayjs =require('dayjs');
const pool = require('../db/connection');
const router = express.Router();

// Request password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email diperlukan.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ? FOR UPDATE', [email]);
    const user = rows[0];

    if (!user) {
      // Don't reveal if email exists. Still commit to end transaction.
      await connection.commit();
      return res.json({ success: true, message: 'Jika email terdaftar, instruksi reset password telah dikirim.' });
    }

    // Rate limiting: max 3 attempts per hour, based on last update time
    if (user.reset_attempts >= 3 && dayjs(user.updated_at).isAfter(dayjs().subtract(1, 'hour'))) {
      await connection.commit();
      return res.status(429).json({ success: false, message: 'Terlalu banyak percobaan. Coba lagi dalam 1 jam.' });
    }

    const resetToken = uuidv4();
    const expiresAt = dayjs().add(1, 'hour').toDate();
    const attempts = dayjs(user.updated_at).isAfter(dayjs().subtract(1, 'hour')) ? user.reset_attempts + 1 : 1;

    await connection.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires_at = ?, reset_attempts = ? WHERE id = ?',
      [resetToken, expiresAt, attempts, user.id]
    );

    await emailService.sendPasswordResetEmail(email, resetToken, user.username);
    await connection.commit();

    res.json({ success: true, message: 'Instruksi reset password telah dikirim ke email Anda.' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error in forgot password:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  } finally {
    if (connection) connection.release();
  }
});

// Verify reset token
router.get('/verify-reset-token', async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token diperlukan.' });
  }

  try {
    const [rows] = await pool.execute('SELECT email, reset_token_expires_at FROM users WHERE reset_token = ?', [token]);
    const user = rows[0];

    if (!user || !user.reset_token_expires_at) {
      return res.status(400).json({ success: false, message: 'Token tidak valid.' });
    }
    if (dayjs().isAfter(dayjs(user.reset_token_expires_at))) {
      return res.status(400).json({ success: false, message: 'Token telah kedaluwarsa.' });
    }

    res.json({ success: true, message: 'Token valid.', email: user.email });
  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'Semua field harus diisi.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Konfirmasi password tidak cocok.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.execute('SELECT * FROM users WHERE reset_token = ? FOR UPDATE', [token]);
    const user = rows[0];

    if (!user || !user.reset_token_expires_at) {
      await connection.commit();
      return res.status(400).json({ success: false, message: 'Token tidak valid.' });
    }
    if (dayjs().isAfter(dayjs(user.reset_token_expires_at))) {
      await connection.commit();
      return res.status(400).json({ success: false, message: 'Token telah kedaluwarsa.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await connection.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL, reset_attempts = 0 WHERE id = ?',
      [hashedPassword, user.id]
    );

    await connection.commit();

    res.json({ success: true, message: 'Password berhasil direset. Silakan login dengan password baru.' });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error resetting password:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
