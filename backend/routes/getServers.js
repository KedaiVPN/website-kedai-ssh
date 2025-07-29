const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const ping = require("ping");
const NodeCache = require("node-cache");

const router = express.Router();
const dbPath = path.join(__dirname, "../db/sellvpn.db");
const db = new sqlite3.Database(dbPath);

const pingCache = new NodeCache({ stdTTL: 60 }); // Cache 60 detik

router.get("/", (req, res) => {
  db.all("SELECT * FROM Server", [], async (err, rows) => {
    if (err) {
      console.error("Error fetching servers:", err);
      return res.status(500).json({ error: "Internal server error" });
    }

    const servers = await Promise.all(
      rows.map(async (row) => {
        const cacheKey = `ping-${row.domain}`;
        let pingMs = pingCache.get(cacheKey);

        if (pingMs === undefined) {
          try {
            const result = await ping.promise.probe(row.domain, { timeout: 2 });
            pingMs = result.alive ? Number(result.time) : 9999;
            pingCache.set(cacheKey, pingMs);
          } catch (e) {
            console.warn("Ping error to", row.domain, e.message);
            pingMs = 9999;
          }
        }

        // ✅ Hitung jumlah user real dari tabel vpn_accounts
        const userCount = await new Promise((resolve) => {
          db.get(
            `SELECT COUNT(*) as total FROM vpn_accounts WHERE server_id = ?`,
            [row.id],
            (err, result) => {
              if (err) {
                console.error("Count user error:", err.message);
                resolve(0);
              } else {
                resolve(result.total);
              }
            }
          );
        });

        return {
          id: row.id.toString(),
          name: row.nama_server,
          domain: row.domain,
          location: row.location || "Unknown",
          auth: row.auth,
          status: row.status || "online",
          protocols: row.protocols
            ? row.protocols.split(",")
            : ["ssh", "vmess", "vless", "trojan"],
          ping: pingMs,
          users: userCount,
          max_users: row.batas_create_akun,
          max_account_creation: row.batas_create_akun,
          quota: row.quota,
          iplimit: row.iplimit,
          batas_create_akun: row.batas_create_akun,
          total_create_akun: row.total_create_akun
        };
      })
    );

    res.json(servers);
  });
});

module.exports = router;