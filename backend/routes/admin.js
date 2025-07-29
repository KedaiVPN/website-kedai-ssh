const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./db/sellvpn.db');

// Get all servers
router.get('/servers', (req, res) => {
  db.all("SELECT * FROM Server", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(rows);
  });
});

// Add new server
router.post('/servers', (req, res) => {
  const {
    domain,
    auth,
    nama_server,
    location = 'Unknown',
    protocols = 'ssh,vmess,vless,trojan',
    status = 'online',
    batas_create_akun = 1000
  } = req.body;

  if (!domain || !auth || !nama_server) {
    return res.status(400).json({ error: "Field domain, auth, nama_server wajib diisi" });
  }

  db.run(
    `INSERT INTO Server (
      domain, auth, nama_server, location, protocols, status, batas_create_akun
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [domain, auth, nama_server, location, protocols, status, batas_create_akun],
    function (err) {
      if (err) return res.status(500).json({ error: "Insert failed" });
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Edit server by ID
router.put('/servers/:id', (req, res) => {
  const {
    domain,
    auth,
    nama_server,
    location,
    protocols,
    status,
    batas_create_akun
  } = req.body;

  if (!domain || !auth || !nama_server) {
    return res.status(400).json({ error: "Field domain, auth, nama_server wajib diisi" });
  }

  db.run(
    `UPDATE Server SET
      domain = ?,
      auth = ?,
      nama_server = ?,
      location = ?,
      protocols = ?,
      status = ?,
      batas_create_akun = ?
     WHERE id = ?`,
    [domain, auth, nama_server, location, protocols, status, batas_create_akun, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Update failed" });
      res.json({ success: true, changes: this.changes });
    }
  );
});

// Delete server by ID
router.delete('/servers/:id', (req, res) => {
  db.run("DELETE FROM Server WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.json({ success: true });
  });
});

module.exports = router;