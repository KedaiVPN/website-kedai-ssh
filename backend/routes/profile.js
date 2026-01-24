const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const emailService = require('../services/emailService');
const { validatePhoneNumber } = require('../utils/phoneValidator');
const dayjs = require('dayjs');

// Get Profile
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const query = `
      SELECT
        username,
        email,
        role,
        created_at,
        total_transaksi,
        auth_provider,
        phone_number
      FROM users
      WHERE id = ?
    `;

    const [rows] = await pool.query(query, [userId]);
    const row = rows[0];

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profileData = {
      username: row.username,
      email: row.email,
      role: row.role || 'member',
      transaction_count: row.total_transaksi || 0,
      created_at: row.created_at,
      auth_provider: row.auth_provider,
      phone_number: row.phone_number
    };
    
    res.json({
      success: true,
      data: profileData,
      message: 'Profile data retrieved successfully'
    });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile data'
    });
  }
});

// Request Change OTP
router.post('/request-change-otp', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { type } = req.body; // 'username', 'password', 'phone'

  if (!['username', 'password', 'phone'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid change type' });
  }

  try {
    const [rows] = await pool.query('SELECT username, email FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpCode = emailService.generateVerificationCode();
    // Expire in 5 minutes
    const expiresAt = dayjs().add(5, 'minute').format('YYYY-MM-DD HH:mm:ss');

    await pool.query(
      'UPDATE users SET otp_token = ?, otp_expires_at = ?, otp_type = ? WHERE id = ?',
      [otpCode, expiresAt, type, userId]
    );

    const emailSent = await emailService.sendChangeOtp(user.email, otpCode, type, user.username);

    if (emailSent) {
      res.json({ success: true, message: 'Kode OTP telah dikirim ke email Anda' });
    } else {
      res.status(500).json({ success: false, message: 'Gagal mengirim email OTP' });
    }
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// Change Username
router.post('/change-username', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { newUsername, otp } = req.body;

  if (!newUsername || !otp) {
    return res.status(400).json({ success: false, message: 'Username baru dan OTP harus diisi' });
  }

  try {
    // Check OTP
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otp_token !== otp || user.otp_type !== 'username') {
      return res.status(400).json({ success: false, message: 'Kode OTP salah' });
    }

    if (dayjs().isAfter(dayjs(user.otp_expires_at))) {
      return res.status(400).json({ success: false, message: 'Kode OTP telah kadaluarsa' });
    }

    // Check unique username
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, userId]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username sudah digunakan' });
    }

    // Update
    await pool.query(
      'UPDATE users SET username = ?, otp_token = NULL, otp_expires_at = NULL, otp_type = NULL WHERE id = ?',
      [newUsername, userId]
    );

    res.json({ success: true, message: 'Username berhasil diubah' });
  } catch (error) {
    console.error('Change username error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { newPassword, otp } = req.body;

  if (!newPassword || !otp) {
    return res.status(400).json({ success: false, message: 'Password baru dan OTP harus diisi' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password minimal 6 karakter' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.auth_provider !== 'email') {
      return res.status(403).json({ success: false, message: 'Fitur ini hanya untuk pengguna login email' });
    }

    if (user.otp_token !== otp || user.otp_type !== 'password') {
      return res.status(400).json({ success: false, message: 'Kode OTP salah' });
    }

    if (dayjs().isAfter(dayjs(user.otp_expires_at))) {
      return res.status(400).json({ success: false, message: 'Kode OTP telah kadaluarsa' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password_hash = ?, otp_token = NULL, otp_expires_at = NULL, otp_type = NULL WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ success: true, message: 'Password berhasil diubah' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// Change Phone
router.post('/change-phone', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { newPhone, otp } = req.body;

  if (!newPhone || !otp) {
    return res.status(400).json({ success: false, message: 'Nomor WhatsApp baru dan OTP harus diisi' });
  }

  const validPhone = validatePhoneNumber(newPhone);
  if (!validPhone) {
    return res.status(400).json({ success: false, message: 'Format nomor WhatsApp tidak valid' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const user = rows[0];

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.otp_token !== otp || user.otp_type !== 'phone') {
      return res.status(400).json({ success: false, message: 'Kode OTP salah' });
    }

    if (dayjs().isAfter(dayjs(user.otp_expires_at))) {
      return res.status(400).json({ success: false, message: 'Kode OTP telah kadaluarsa' });
    }

    await pool.query(
      'UPDATE users SET phone_number = ?, otp_token = NULL, otp_expires_at = NULL, otp_type = NULL WHERE id = ?',
      [validPhone, userId]
    );

    res.json({ success: true, message: 'Nomor WhatsApp berhasil diubah' });
  } catch (error) {
    console.error('Change phone error:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

module.exports = router;
