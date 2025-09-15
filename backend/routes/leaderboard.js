const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// GET /api/leaderboard - Get top 10 users by total transactions
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT username, role, total_transaksi FROM users ORDER BY total_transaksi DESC LIMIT 10'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
