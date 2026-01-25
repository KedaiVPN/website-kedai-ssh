const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

// Get total transaction count for landing page
router.get('/total-transactions', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) as total FROM balance_transactions WHERE reference_type != 'trial'");
    const total = rows[0].total;

    res.json({ success: true, totalTransactions: total });
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

module.exports = router;
