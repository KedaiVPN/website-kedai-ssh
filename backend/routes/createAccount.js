const express = require("express");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');
const TelegramService = require('../services/telegramService');
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

  console.log(`[CreateAccount] Request from user ${userId}: ${username} (${protocol}) - ${ip_limit} IP × ${duration} days`);

  if (!username || !protocol || !duration || !ip_limit || !serverId) {
    return res.status(400).json({ success: false, message: "Parameter tidak lengkap" });
  }

  // Calculate quota based on IP limit (override any frontend-sent quota)
  const calculatedQuota = calculateQuotaFromIPLimit(ip_limit);
  
  try {
    // Get user role for pricing calculation
    const userRole = await BalanceService.getUserRole(userId);
    console.log(`[CreateAccount] User role: ${userRole}`);
    
    // Calculate account cost using role-based pricing system (per-server if available)
    const totalCost = await BalanceService.calculateServerAccountCost(ip_limit, duration, userRole, serverId);
    const dailyPrice = await BalanceService.getDailyPrice(ip_limit, userRole, serverId);
    
    console.log(`[CreateAccount] Cost calculation: ${ip_limit} IP × ${duration} days = Rp${totalCost} (Daily: Rp${dailyPrice}, Role: ${userRole})`);

    // Check if user has sufficient balance
    const balanceCheck = await BalanceService.validateSufficientBalance(userId, totalCost);
    
    if (!balanceCheck.sufficient) {
      console.log(`[CreateAccount] Insufficient balance: Required ${totalCost}, Available ${balanceCheck.currentBalance}`);
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

    console.log(`[CreateAccount] Balance sufficient: Rp${balanceCheck.currentBalance} >= Rp${totalCost}`);

  } catch (error) {
    console.error('[CreateAccount] Balance validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memvalidasi saldo'
    });
  }

  // Check server and active accounts limit
  db.get("SELECT * FROM Server WHERE id = ?", [serverId], (err, server) => {
    if (err || !server) {
      console.error('[CreateAccount] Server not found:', serverId);
      return res.status(404).json({ success: false, message: "Server tidak ditemukan" });
    }

    // Count active accounts on this server (accounts that haven't expired)
    db.get(`
      SELECT COUNT(*) as active_count 
      FROM vpn_account 
      WHERE server_id = ? AND expired_date > date('now')
    `, [serverId], async (countErr, countResult) => {
      if (countErr) {
        console.error('[CreateAccount] Error counting active accounts:', countErr);
        return res.status(500).json({ success: false, message: "Gagal memeriksa kapasitas server" });
      }

      const activeAccountsCount = countResult.active_count;
      console.log(`[CreateAccount] Server ${server.nama_server}: ${activeAccountsCount}/${server.batas_create_akun} active accounts`);

      // Check if server has reached the limit of active accounts
      if (activeAccountsCount >= server.batas_create_akun) {
        console.log(`[CreateAccount] Server ${server.nama_server} has reached active accounts limit: ${activeAccountsCount}/${server.batas_create_akun}`);
        return res.status(400).json({ 
          success: false, 
          message: `Server ${server.nama_server} telah mencapai batas maksimum akun aktif (${server.batas_create_akun} akun). Silakan pilih server lain atau coba lagi nanti.` 
        });
      }

      // Deduct balance first before creating account
      const processAccountCreation = async () => {
        try {
          const userRole = await BalanceService.getUserRole(userId);
          const totalCost = await BalanceService.calculateServerAccountCost(ip_limit, duration, userRole, serverId);
          
          console.log(`[CreateAccount] About to DEDUCT ${totalCost} from user ${userId} (${userRole})`);
          
          const deductResult = await BalanceService.deductBalance(
            userId, 
            totalCost, 
            `Pembuatan akun ${protocol.toUpperCase()}: ${username} (${ip_limit} IP × ${duration} hari) - ${userRole.toUpperCase()}`,
            'account_creation',
            null // Will be updated with account ID later
          );

          console.log(`[CreateAccount] Balance deducted successfully: ${deductResult.balanceBefore} -> ${deductResult.balanceAfter}`);

          // Now call the server API
          const endpoint = `http://${server.domain}:5888/create${protocol}?user=${username}` +
            (protocol === "ssh" ? `&password=${password || "123"}` : "") +
            `&exp=${duration}&quota=${calculatedQuota}&iplimit=${ip_limit}&auth=${server.auth}`;

          console.log(`[CreateAccount] Calling API: ${endpoint}`);
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
                console.error("[CreateAccount] Database insert error:", err);
                
                // Refund balance since account creation failed
                try {
                  await BalanceService.addBalance(
                    userId,
                    totalCost,
                    `Refund pembuatan akun gagal: ${username}`,
                    'refund',
                    null
                  );
                  console.log(`[CreateAccount] Balance refunded: Rp${totalCost}`);
                } catch (refundError) {
                  console.error('[CreateAccount] Failed to refund balance:', refundError);
                }
                
                return res.status(500).json({ success: false, message: "Gagal menyimpan ke database" });
              }
              
              const accountId = this.lastID;
              console.log(`[CreateAccount] Account created in DB with ID: ${accountId}`);

              // Update total_create_akun di Server (keep for historical data)
              db.run(`UPDATE Server SET total_create_akun = total_create_akun + 1 WHERE id = ?`, [serverId], async (updateErr) => {
                if (updateErr) {
                  console.error('[CreateAccount] Failed to update server stats:', updateErr);
                }

                try {
                  const dailyPrice = await BalanceService.getDailyPrice(ip_limit, userRole, serverId);
                  
                  // Send Telegram notification for account creation
                  try {
                    const telegramService = new TelegramService();
                    
                    await telegramService.notifyAccountCreation({
                      username: req.user.username,
                      userRole: userRole,
                      accountName: serverUsername
                      serverName: server.nama_server,
                      protocol: protocol.toUpperCase(),
                      duration: duration,
                      totalCost: totalCost,
                      userId: userId
                    });
                    
                    console.log('[TelegramService] Account creation notification sent');
                  } catch (telegramError) {
                    console.error('[TelegramService] Failed to send account creation notification:', telegramError.message);
                  }
                  
                  // Return success response
                  return res.json({
                    success: true,
                    message: `${data.message} | Biaya: Rp${totalCost.toLocaleString('id-ID')} (${userRole === 'reseller' ? 'Harga Reseller -50%' : 'Harga Member'})`,
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
                } catch (responseError) {
                  console.error('[CreateAccount] Error preparing response:', responseError);
                  return res.json({
                    success: true,
                    message: `${data.message} | Biaya: Rp${totalCost.toLocaleString('id-ID')} (${userRole === 'reseller' ? 'Harga Reseller -50%' : 'Harga Member'})`,
                    data: {
                      ...data.data,
                      username: serverUsername,
                      quota: calculatedQuota,
                      cost: totalCost,
                      userRole: userRole,
                      newBalance: deductResult.balanceAfter
                    }
                  });
                }
              });
            });
          } else {
            console.error('[CreateAccount] Server API error:', data.message);
            
            // Refund balance since API call failed
            try {
              await BalanceService.addBalance(
                userId,
                totalCost,
                `Refund API gagal: ${data.message}`,
                'refund',
                null
              );
              console.log(`[CreateAccount] Balance refunded due to API error: Rp${totalCost}`);
            } catch (refundError) {
              console.error('[CreateAccount] Failed to refund balance:', refundError);
            }
            
            return res.status(400).json({ success: false, message: data.message });
          }
        } catch (apiError) {
          console.error("[CreateAccount] API error:", apiError.message);
          
          // Refund balance since API call failed
          try {
            const userRole = await BalanceService.getUserRole(userId);
            const totalCost = await BalanceService.calculateServerAccountCost(ip_limit, duration, userRole, serverId);
            
            await BalanceService.addBalance(
              userId,
              totalCost,
              `Refund API error: ${apiError.message}`,
              'refund',
              null
            );
            console.log(`[CreateAccount] Balance refunded due to API error: Rp${totalCost}`);
          } catch (refundError) {
            console.error('[CreateAccount] Failed to refund balance:', refundError);
          }
          
          return res.status(500).json({ success: false, message: "Gagal menghubungi API server" });
        }
      };

      // Execute account creation
      await processAccountCreation();
    });
  });
});

module.exports = router;
