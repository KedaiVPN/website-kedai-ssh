
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ping = require('ping');
const NodeCache = require('node-cache');
const router = express.Router();

const dbPath = path.join(__dirname, '../db/database.sqlite');

// Create cache instance with 1 minute TTL
const pingCache = new NodeCache({ stdTTL: 60 });

// Function to ping a server
async function pingServer(domain) {
  try {
    // Check cache first
    const cachedPing = pingCache.get(domain);
    if (cachedPing !== undefined) {
      return cachedPing;
    }

    // Perform actual ping
    const result = await ping.promise.probe(domain, {
      timeout: 5,
      extra: ['-c', '3']
    });

    const pingValue = result.alive ? Math.round(result.time) : 999;
    
    // Cache the result
    pingCache.set(domain, pingValue);
    
    return pingValue;
  } catch (error) {
    console.error(`Ping error for ${domain}:`, error);
    return 999;
  }
}

router.get('/', async (req, res) => {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database connection error:', err);
      return res.status(500).json({
        success: false,
        message: 'Database connection failed'
      });
    }
  });

  // Query untuk mengambil data server beserta jumlah akun aktif (belum expired)
  // Show servers with status: online, maintenance, full - hide only 'offline' servers
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
      WHERE expired_date > date('now')
      GROUP BY server_id
    ) active_accounts ON s.id = active_accounts.server_id
    WHERE s.status IN ('online', 'maintenance', 'full')
    ORDER BY s.id
  `;

  db.all(query, [], async (err, rows) => {
    if (err) {
      console.error('Database query error:', err);
      db.close();
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch servers'
      });
    }

    console.log(`Found ${rows.length} visible servers (excluding offline)`);

    // Transform data untuk frontend dengan ping real-time
    const servers = await Promise.all(rows.map(async (row) => {
      // Hitung apakah server sudah mencapai batas
      const isAtLimit = row.active_accounts_count >= row.batas_create_akun;
      
      // Tentukan status final berdasarkan kondisi server
      let finalStatus = row.status;
      if (row.status === 'online' && isAtLimit) {
        finalStatus = 'full';
      }
      
      console.log(`Server ${row.nama_server}: ${row.active_accounts_count}/${row.batas_create_akun} active accounts (Status: ${row.status} -> ${finalStatus})`);

      // Ping server untuk mendapatkan latency real-time
      const currentPing = await pingServer(row.domain);

      return {
        id: row.id.toString(),
        name: row.nama_server,
        domain: row.domain,
        location: row.location || 'Unknown',
        auth: row.auth,
        status: finalStatus, // Use calculated final status
        protocols: (row.protocols || 'ssh,vmess,vless,trojan').split(','),
        ping: currentPing, // Gunakan ping real-time
        users: row.active_accounts_count, // Gunakan active accounts count
        batas_create_akun: row.batas_create_akun,
        total_create_akun: row.active_accounts_count, // Untuk konsistensi dengan frontend
        originalStatus: row.status // Simpan status asli untuk referensi
      };
    }));

    db.close();
    
    res.json({
      success: true,
      data: servers,
      message: 'Servers fetched successfully'
    });
  });
});

module.exports = router;
