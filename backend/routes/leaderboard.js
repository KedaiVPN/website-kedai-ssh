const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

// GET /api/leaderboard - Get top 10 users by total transactions for the current month
router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT
        u.username,
        u.role,
        SUM(t.transaction_count) as total_transaksi
      FROM (
        -- Count VPN account creations for the current month
        SELECT
          user_id,
          COUNT(*) as transaction_count
        FROM vpn_account
        WHERE
          MONTH(created_at) = MONTH(CURDATE()) AND
          YEAR(created_at) = YEAR(CURDATE())
        GROUP BY user_id

        UNION ALL

        -- Count successful top-up transactions for the current month
        SELECT
          user_id,
          COUNT(*) as transaction_count
        FROM topup_transactions
        WHERE
          status = 'success' AND
          MONTH(created_at) = MONTH(CURDATE()) AND
          YEAR(created_at) = YEAR(CURDATE())
        GROUP BY user_id
      ) AS t
      JOIN users u ON t.user_id = u.id
      GROUP BY t.user_id, u.username, u.role
      ORDER BY total_transaksi DESC
      LIMIT 10;
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
