
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const dayjs = require('dayjs');
const path = require('path');

const router = express.Router();
const dbPath = path.join(__dirname, '../db/database.sqlite');

// Request password reset
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  const db = new sqlite3.Database(dbPath);

  try {
    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({
        success: true,
        message: 'Jika email terdaftar, instruksi reset password telah dikirim'
      });
    }

    // Check reset attempts (max 3 per hour)
    if (user.reset_attempts >= 3) {
      const lastAttempt = dayjs(user.updated_at);
      const hourAgo = dayjs().subtract(1, 'hour');
      
      if (lastAttempt.isAfter(hourAgo)) {
        return res.status(429).json({
          success: false,
          message: 'Terlalu banyak percobaan reset. Coba lagi dalam 1 jam'
        });
      }
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = dayjs().add(1, 'hour').toISOString();
    const attempts = user.reset_attempts >= 3 ? 1 : user.reset_attempts + 1;

    // Update user with reset token
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET 
         reset_token = ?, 
         reset_token_expires_at = ?, 
         reset_attempts = ?,
         updated_at = CURRENT_TIMESTAMP 
         WHERE email = ?`,
        [resetToken, expiresAt, attempts, email],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    // Send reset email
    const emailSent = await emailService.sendPasswordResetEmail(email, resetToken, user.username);
    
    if (emailSent) {
      res.json({
        success: true,
        message: 'Instruksi reset password telah dikirim ke email Anda'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Gagal mengirim email reset password'
      });
    }

  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  } finally {
    db.close();
  }
});

// Verify reset token
router.get('/verify-reset-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required'
    });
  }

  const db = new sqlite3.Database(dbPath);

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE reset_token = ?',
        [token],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user || !user.reset_token_expires_at) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak valid'
      });
    }

    const now = dayjs();
    const expiresAt = dayjs(user.reset_token_expires_at);

    if (now.isAfter(expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Token telah kedaluwarsa'
      });
    }

    res.json({
      success: true,
      message: 'Token valid',
      email: user.email
    });

  } catch (error) {
    console.error('Error verifying reset token:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  } finally {
    db.close();
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Semua field harus diisi'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Konfirmasi password tidak cocok'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password minimal 6 karakter'
    });
  }

  const db = new sqlite3.Database(dbPath);

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE reset_token = ?',
        [token],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user || !user.reset_token_expires_at) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak valid'
      });
    }

    const now = dayjs();
    const expiresAt = dayjs(user.reset_token_expires_at);

    if (now.isAfter(expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Token telah kedaluwarsa'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET 
         password_hash = ?, 
         reset_token = NULL, 
         reset_token_expires_at = NULL, 
         reset_attempts = 0,
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [hashedPassword, user.id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });

    res.json({
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  } finally {
    db.close();
  }
});

module.exports = router;
