const express = require("express");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');
const router = express.Router();

const dbPath = path.join(__dirname, "../db/database.sqlite");
const db = new sqlite3.Database(dbPath);

// Quota mapping based on IP limits
const QUOTA_BY_IP_LIMIT = {
  1: 200, // 1 IP = 200GB
  2: 400, // 2 IP = 400GB
  4: 600  // 4 IP/STB = 600GB
};

// Function to calculate quota from IP limit
const calculateQuotaFromIPLimit = (ipLimit) => {
  return QUOTA_BY_IP_LIMIT[ipLimit] || 200; // Default to 200GB if not found
};

// Apply authentication middleware
router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { username, password, protocol, duration, quota, ip_limit, serverId } = req.body;

  console.log(`Creating account for authenticated user: ${userId}`);

  if (!username || !protocol || !duration || !ip_limit || !serverId) {
    return res.status(400).json({ success: false, message: "Parameter tidak lengkap" });
  }

  // Calculate quota based on IP limit (override any frontend-sent quota)
  const calculatedQuota = calculateQuotaFromIPLimit(ip_limit);
  
  try {
    // Get user role for pricing calculation
    const userRole = await BalanceService.getUserRole(userId);
    
    // Calculate account cost using role-based pricing system
    const totalCost = BalanceService.calculateAccountCost(ip_limit, duration, userRole);
    console.log(`Account cost calculated: ${ip_limit} IP × ${duration} days = Rp${totalCost.toLocaleString('id-ID')} (Role: ${userRole})`);

    // Check if user has sufficient balance
    const balanceCheck = await BalanceService.validateSufficientBalance(userId, totalCost);
    
    if (!balanceCheck.sufficient) {
      return res.status(400).json({
        success: false,
        message: `Saldo tidak mencukupi. Dibutuhkan Rp${totalCost.toLocaleString('id-ID')}, saldo Anda Rp${balanceCheck.currentBalance.toLocaleString('id-ID')}. Kekurangan Rp${balanceCheck.shortage.toLocaleString('id-ID')}.`,
        data: {
          required: totalCost,
          current: balanceCheck.currentBalance,
          shortage: balanceCheck.shortage
        }
      });
    }

    console.log(`Balance sufficient: Rp${balanceCheck.currentBalance.toLocaleString('id-ID')} >= Rp${totalCost.toLocaleString('id-ID')}`);

  } catch (error) {
    console.error('Balance validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memvalidasi saldo'
    });
  }

  db.get("SELECT * FROM Server WHERE id = ?", [serverId], async (err, server) => {
    if (err || !server) {
      return res.status(404).json({ success: false, message: "Server tidak ditemukan" });
    }

    const endpoint = `http://${server.domain}:5888/create${protocol}?user=${username}` +
      (protocol === "ssh" ? `&password=${password || "123"}` : "") +
      `&exp=${duration}&quota=${calculatedQuota}&iplimit=${ip_limit}&auth=${server.auth}`;

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
          username: serverUsername,
          password: protocol === "ssh" ? (data.data.password || password || "123") : null,
          protocol: protocol,
          server_id: serverId,
          duration: duration,
          quota: calculatedQuota,
          ip_limit: ip_limit,
          user_id: userId,
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
        stmt.run(values, async function(err) {
          if (err) {
            console.error("Database insert error:", err);
            return res.status(500).json({ success: false, message: "Gagal menyimpan ke database" });
          }
          
          const accountId = this.lastID;

          try {
            // Get user role and deduct balance after successful account creation
            const userRole = await BalanceService.getUserRole(userId);
            const totalCost = BalanceService.calculateAccountCost(ip_limit, duration, userRole);
            const dailyPrice = BalanceService.getPriceByIPLimit(ip_limit, userRole);
            
            const deductResult = await BalanceService.deductBalance(
              userId, 
              totalCost, 
              `Pembuatan akun ${protocol.toUpperCase()}: ${serverUsername} (${ip_limit} IP × ${duration} hari) - ${userRole.toUpperCase()}`,
              'account_creation',
              accountId
            );

            console.log(`Balance deducted successfully: Rp${totalCost.toLocaleString('id-ID')}`);
            console.log(`New balance: Rp${deductResult.balanceAfter.toLocaleString('id-ID')}`);

            // Update total_create_akun di Server
            db.run(`UPDATE Server SET total_create_akun = total_create_akun + 1 WHERE id = ?`, [serverId]);

            // Return the server response with pricing information
            return res.json({
              success: true,
              message: data.message + ` | Biaya: Rp${totalCost.toLocaleString('id-ID')} (${userRole === 'reseller' ? 'Harga Reseller -50%' : 'Harga Member'})`,
              data: {
                ...data.data,
                username: serverUsername,
                quota: calculatedQuota,
                cost: totalCost,
                dailyPrice: dailyPrice,
                userRole: userRole,
                newBalance: deductResult.balanceAfter
              }
            });

          } catch (balanceError) {
            console.error('Balance deduction failed:', balanceError);
            
            // If balance deduction fails, we should ideally rollback the account creation
            // For now, we'll return an error but the account is still created
            return res.status(500).json({
              success: false,
              message: 'Akun berhasil dibuat tetapi gagal mengurangi saldo. Silakan hubungi administrator.'
            });
          }
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
