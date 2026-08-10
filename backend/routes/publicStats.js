const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Get total transaction count for landing page
router.get('/total-transactions', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT SUM(total_transaksi) as total FROM users");
    const total = parseInt(rows[0].total) || 0;

    res.json({ success: true, totalTransactions: total });
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

module.exports = router;
