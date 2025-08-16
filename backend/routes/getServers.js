
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

const dbPath = path.join(__dirname, '../db/database.sqlite');

router.get('/', (req, res) => {
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
    WHERE s.status = 'online'
    ORDER BY s.id
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Database query error:', err);
      db.close();
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch servers'
      });
    }

    console.log(`Found ${rows.length} active servers`);

    // Transform data untuk frontend
    const servers = rows.map(row => {
      // Hitung apakah server sudah mencapai batas
      const isAtLimit = row.active_accounts_count >= row.batas_create_akun;
      
      console.log(`Server ${row.nama_server}: ${row.active_accounts_count}/${row.batas_create_akun} active accounts (At limit: ${isAtLimit})`);

      return {
        id: row.id.toString(),
        name: row.nama_server,
        domain: row.domain,
        location: row.location || 'Unknown',
        auth: row.auth,
        status: isAtLimit ? 'full' : row.status, // Set status ke full jika sudah mencapai batas
        protocols: (row.protocols || 'ssh,vmess,vless,trojan').split(','),
        ping: row.ping || 0, // Pastikan ping selalu ada nilainya
        users: row.active_accounts_count, // Gunakan active accounts count
        batas_create_akun: row.batas_create_akun,
        total_create_akun: row.active_accounts_count, // Untuk konsistensi dengan frontend
        originalStatus: row.status // Simpan status asli untuk referensi
      };
    });

    db.close();
    
    res.json({
      success: true,
      data: servers,
      message: 'Servers fetched successfully'
    });
  });
});

module.exports = router;
