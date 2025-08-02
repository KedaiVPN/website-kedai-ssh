
const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Database connection
const dbPath = path.join(__dirname, '../db/database.sqlite');

router.get('/:userId', (req, res) => {
  const userId = req.params.userId;
  
  console.log(`Fetching VPN accounts for user: ${userId}`);
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed'
      });
    }
  });

  // Query to get user's VPN accounts with server information
  const query = `
    SELECT 
      va.*,
      s.domain as server_domain,
      s.nama_server as server_name,
      s.location as server_location,
      s.status as server_status
    FROM vpn_account va
    LEFT JOIN Server s ON va.server_id = s.id
    WHERE va.user_id = ?
    ORDER BY va.created_at DESC
  `;

  db.all(query, [userId], (err, rows) => {
    if (err) {
      console.error('Database query error:', err);
      db.close();
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch accounts'
      });
    }

    console.log(`Found ${rows.length} VPN accounts for user ${userId}`);

    // Transform data to match frontend expectations
    const accounts = rows.map(row => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() + (row.duration || 1));
      
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        protocol: row.protocol,
        server_id: row.server_id,
        server_name: row.server_name,
        server_domain: row.server_domain,
        server_location: row.server_location,
        server_status: row.server_status,
        duration: row.duration,
        quota: row.quota,
        ip_limit: row.ip_limit,
        created_at: row.created_at,
        expired_date: expiredDate.toLocaleDateString('id-ID'),
        status: expiredDate > new Date() ? 'active' : 'expired'
      };
    });

    db.close();
    
    res.json({
      success: true,
      data: accounts,
      message: 'Accounts fetched successfully'
    });
  });
});

module.exports = router;
