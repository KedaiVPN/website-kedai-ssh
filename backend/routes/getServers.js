const express = require('express');
const pool = require('../db/connection');
const path = require('path');
const ping = require('ping');
const NodeCache = require('node-cache');
const router = express.Router();

const pingCache = new NodeCache({ stdTTL: 60 });

async function pingServer(domain) {
  try {
    const cachedPing = pingCache.get(domain);
    if (cachedPing !== undefined) {
      return cachedPing;
    }

    const result = await ping.promise.probe(domain, {
      timeout: 5,
      extra: ['-c', '3']
    });

    const pingValue = result.alive ? Math.round(result.time) : 999;
    pingCache.set(domain, pingValue);
    return pingValue;
  } catch (error) {
    console.error(`Ping error for ${domain}:`, error);
    return 999;
  }
}

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

    const servers = await Promise.all(rows.map(async (row) => {
      const isAtLimit = row.active_accounts_count >= row.batas_create_akun;
      let finalStatus = row.status;
      if (row.status === 'online' && isAtLimit) {
        finalStatus = 'full';
      }
      
      const currentPing = await pingServer(row.domain);
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
        total_create_akun: row.total_create_akun
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
    }));
    
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
