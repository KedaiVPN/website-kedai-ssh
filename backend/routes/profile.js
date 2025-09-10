const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db/connection');

// Get user profile data
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

    const [rows] = await pool.execute(query, [userId]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const profileData = {
      username: user.username,
      email: user.email,
      role: user.role || 'member',
      transaction_count: user.total_transaksi || 0,
      created_at: user.created_at
    };
    
    res.json({
      success: true,
      data: profileData,
      message: 'Profile data retrieved successfully'
    });

  } catch (error) {
    console.error(`Failed to fetch profile data for user ${userId}:`, error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data profil'
    });
  }
});

module.exports = router;
