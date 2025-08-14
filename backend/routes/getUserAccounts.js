
const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { authenticateToken } = require('../middleware/auth');

// Database connection
const dbPath = path.join(__dirname, '../db/database.sqlite');

// Apply authentication middleware
router.get('/', authenticateToken, (req, res) => {
  // Get user ID from authenticated token instead of URL parameter
  const userId = req.user.id;
  
  console.log(`Fetching VPN accounts for authenticated user: ${userId}`);
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed'
      });
    }
  });

  // Query to get ALL user's VPN accounts (active and expired) with server information
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

    console.log(`Found ${rows.length} total VPN accounts for user ${userId}`);

    // Transform data to match frontend expectations
    const accounts = rows.map(row => {
      const expiredDate = row.expired_date ? new Date(row.expired_date) : new Date();
      const now = new Date();
      
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
        status: expiredDate > now ? 'active' : 'expired',
        // SSH specific fields
        ssh_ws_port: row.ssh_ws_port,
        ssh_ssl_port: row.ssh_ssl_port,
        // V2Ray specific fields
        uuid: row.uuid,
        ns_domain: row.ns_domain,
        vmess_tls_link: row.vmess_tls_link,
        vmess_nontls_link: row.vmess_nontls_link,
        vmess_grpc_link: row.vmess_grpc_link,
        vless_tls_link: row.vless_tls_link,
        vless_nontls_link: row.vless_nontls_link,
        vless_grpc_link: row.vless_grpc_link,
        trojan_tls_link: row.trojan_tls_link,
        trojan_nontls_link1: row.trojan_nontls_link1,
        trojan_grpc_link: row.trojan_grpc_link
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
