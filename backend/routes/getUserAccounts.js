const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db/connection'); // Use MySQL pool

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  try {
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

    const [rows] = await pool.execute(query, [userId]);

    const accounts = rows.map(row => {
      // The expired_date from MySQL is a Date object or a string that can be parsed
      const expiredDate = new Date(row.expired_date);
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
        expired_date: expiredDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }),
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

    res.json({
      success: true,
      data: accounts,
      message: 'Accounts fetched successfully'
    });

  } catch (error) {
    console.error('Failed to fetch user accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data akun'
    });
  }
});

module.exports = router;
