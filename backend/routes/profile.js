const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const query = `
      SELECT
        username,
        email,
        role,
        created_at,
        total_transaksi
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
      created_at: row.created_at
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

module.exports = router;
