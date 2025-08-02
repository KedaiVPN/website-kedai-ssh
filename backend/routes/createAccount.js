
const express = require("express");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const router = express.Router();

const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

router.post("/", (req, res) => {
  const { userId, username, password, protocol, duration, quota, ip_limit, serverId } = req.body;

  if (!username || !protocol || !duration || !ip_limit || !serverId) {
    return res.status(400).json({ success: false, message: "Parameter tidak lengkap" });
  }

  db.get("SELECT * FROM Server WHERE id = ?", [serverId], async (err, server) => {
    if (err || !server) {
      return res.status(404).json({ success: false, message: "Server tidak ditemukan" });
    }

    const endpoint = `http://${server.domain}:5888/create${protocol}?user=${username}` +
      (protocol === "ssh" ? `&password=${password || "123"}` : "") +
      `&exp=${duration}&quota=${quota || 0}&iplimit=${ip_limit}&auth=${server.auth}`;

    try {
      const response = await axios.get(endpoint);
      const data = response.data;

      if (data.status === "success") {
        // Calculate expired date
        const expiredDate = new Date();
        expiredDate.setDate(expiredDate.getDate() + duration);
        const expiredDateString = expiredDate.toISOString().split('T')[0]; // YYYY-MM-DD format

        // Use username from server response, not from user input
        const serverUsername = data.data.username || username;

        // Prepare data for database insertion
        let dbData = {
          username: serverUsername, // Store username from server response
          password: protocol === "ssh" ? (data.data.password || password || "123") : null,
          protocol: protocol,
          server_id: serverId,
          duration: duration,
          quota: quota || 0,
          ip_limit: ip_limit,
          user_id: userId || null,
          expired_date: expiredDateString
        };

        // Add protocol-specific data from server response
        if (protocol === "ssh") {
          dbData.ssh_ws_port = data.data.ssh_ws_port || "80";
          dbData.ssh_ssl_port = data.data.ssh_ssl_port || "443";
        } else {
          // V2Ray protocols - store all URLs and details
          dbData.uuid = data.data.uuid;
          dbData.ns_domain = data.data.ns_domain;
          
          if (protocol === "vmess") {
            dbData.vmess_tls_link = data.data.vmess_tls_link;
            dbData.vmess_nontls_link = data.data.vmess_nontls_link;
            dbData.vmess_grpc_link = data.data.vmess_grpc_link;
          } else if (protocol === "vless") {
            dbData.vless_tls_link = data.data.vless_tls_link;
            dbData.vless_nontls_link = data.data.vless_nontls_link;
            dbData.vless_grpc_link = data.data.vless_grpc_link;
          } else if (protocol === "trojan") {
            dbData.trojan_tls_link = data.data.trojan_tls_link;
            dbData.trojan_nontls_link1 = data.data.trojan_nontls_link1;
            dbData.trojan_grpc_link = data.data.trojan_grpc_link;
          }
        }

        // Dynamic SQL generation based on available data
        const columns = Object.keys(dbData).filter(key => dbData[key] !== null && dbData[key] !== undefined);
        const placeholders = columns.map(() => '?').join(', ');
        const values = columns.map(key => dbData[key]);
        
        const insertSQL = `INSERT INTO vpn_account (${columns.join(', ')}) VALUES (${placeholders})`;
        
        const stmt = db.prepare(insertSQL);
        stmt.run(values, function(err) {
          if (err) {
            console.error("Database insert error:", err);
            return res.status(500).json({ success: false, message: "Gagal menyimpan ke database" });
          }
          
          // Update total_create_akun di Server
          db.run(`UPDATE Server SET total_create_akun = total_create_akun + 1 WHERE id = ?`, [serverId]);

          // Return the server response with the actual username that was created
          return res.json({
            success: true,
            message: data.message,
            data: {
              ...data.data,
              username: serverUsername // Ensure we return the server's username
            }
          });
        });
      } else {
        return res.status(400).json({ success: false, message: data.message });
      }
    } catch (e) {
      console.error("API error:", e.message);
      return res.status(500).json({ success: false, message: "Gagal menghubungi API server" });
    }
  });
});

module.exports = router;
