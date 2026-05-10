const express = require('express');
const pool = require('../db/connection');
const { getPing } = require('../services/serverStatusService'); // Import service
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        s.*,
        COALESCE(active_accounts.count, 0) as active_accounts_count
      FROM Server s
      LEFT JOIN (
        SELECT
          server_id,
          COUNT(*) as count
        FROM vpn_account
        WHERE expired_date > NOW()
        GROUP BY server_id
      ) active_accounts ON s.id = active_accounts.server_id
      WHERE s.status IN ('online', 'offline', 'maintenance', 'full')
      ORDER BY s.id
    `;

    const [rows] = await pool.query(query);

    // Map rows directly since we don't need async ping here anymore
    const servers = rows.map((row) => {
      const isAtLimit = row.active_accounts_count >= row.batas_create_akun;
      let finalStatus = row.status;
      if (row.status === 'online' && isAtLimit) {
        finalStatus = 'full';
      }
      
      // Get ping from cache (or default to 999 if not yet available)
      const cachedPing = getPing(row.domain);
      const currentPing = cachedPing !== undefined ? cachedPing : 999;

      const userRole = req.user?.role || 'member';
      
      const baseData = {
        id: row.id.toString(),
        name: row.nama_server,
        location: row.location || 'Unknown',
        status: finalStatus,
        protocols: (row.protocols || 'ssh,vmess,vless,trojan').split(','),
        ping: currentPing,
        users: row.active_accounts_count,
        batas_create_akun: row.batas_create_akun,
        total_create_akun: row.total_create_akun,
        url_monitoring: row.url_monitoring
      };

      if (userRole === 'admin') {
        return {
          ...baseData,
          domain: row.domain,
          auth: row.auth,
          originalStatus: row.status
        };
      }

      return baseData;
    });
    
    res.json({
      success: true,
      data: servers,
      message: 'Servers fetched successfully'
    });
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch servers'
    });
  }
});

module.exports = router;
