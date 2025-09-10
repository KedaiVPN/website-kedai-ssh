const express = require('express');
const ping = require('ping');
const NodeCache = require('node-cache');
const router = express.Router();
const pool = require('../db/connection'); // Use the new MySQL connection pool

// Create cache instance with 1 minute TTL for ping results
const pingCache = new NodeCache({ stdTTL: 60 });

// Function to ping a server (no changes needed here)
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
  let connection;
  try {
    connection = await pool.getConnection();

    // MySQL-compatible query
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
        WHERE expired_date > NOW()  -- Changed from date('now')
        GROUP BY server_id
      ) active_accounts ON s.id = active_accounts.server_id
      WHERE s.status IN ('online', 'offline', 'maintenance', 'full')
      ORDER BY s.id
    `;

    const [rows] = await connection.execute(query);
    console.log(`Found ${rows.length} visible servers`);

    const servers = await Promise.all(rows.map(async (row) => {
      const isAtLimit = row.active_accounts_count >= row.batas_create_akun;
      
      let finalStatus = row.status;
      if (row.status === 'online' && isAtLimit) {
        finalStatus = 'full';
      }
      
      // console.log(`Server ${row.nama_server}: ${row.active_accounts_count}/${row.batas_create_akun} active accounts (Status: ${row.status} -> ${finalStatus})`);

      const currentPing = await pingServer(row.domain);
      // The user object might not exist for public requests, provide a default role.
      const userRole = req.user?.role || 'guest';
      
      const baseData = {
        id: row.id.toString(),
        name: row.nama_server,
        location: row.location || 'Unknown',
        status: finalStatus,
        protocols: (row.protocols || 'ssh,vmess,vless,trojan').split(','),
        ping: currentPing,
        users: row.active_accounts_count
      };

      // For 'member' and 'guest', show limited data
      if (userRole === 'member' || userRole === 'guest') {
        return {
          ...baseData,
          batas_create_akun: row.batas_create_akun,
          total_create_akun: row.active_accounts_count
        };
      }

      // For 'admin', show all data
      if (userRole === 'admin') {
        return {
          ...baseData,
          domain: row.domain,
          auth: row.auth,
          batas_create_akun: row.batas_create_akun,
          total_create_akun: row.active_accounts_count,
          originalStatus: row.status
        };
      }

      // Fallback for any other roles
      return baseData;
    }));
    
    res.json({
      success: true,
      data: servers,
      message: 'Servers fetched successfully'
    });

  } catch (error) {
    console.error('Database query error in getServers.js:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch servers due to a server error.'
    });
  } finally {
    if (connection) {
      connection.release();
      // console.log("MySQL connection released.");
    }
  }
});

module.exports = router;
