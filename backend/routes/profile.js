
const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { authenticateToken } = require('../middleware/auth');

// Database connection
const dbPath = path.join(__dirname, '../db/database.sqlite');

// Get user profile data
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  console.log(`Fetching profile data for user: ${userId}`);
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed'
      });
    }
  });

  // Query to get user data with the new transaction counter
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

  db.get(query, [userId], (err, row) => {
    if (err) {
      console.error('Database query error:', err);
      db.close();
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch profile data'
      });
    }

    if (!row) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`Profile data found for user ${userId}:`, row);

    // Format the response
    const profileData = {
      username: row.username,
      email: row.email,
      role: row.role || 'member',
      transaction_count: row.total_transaksi || 0,
      created_at: row.created_at
    };

    db.close();
    
    res.json({
      success: true,
      data: profileData,
      message: 'Profile data retrieved successfully'
    });
  });
});

module.exports = router;
