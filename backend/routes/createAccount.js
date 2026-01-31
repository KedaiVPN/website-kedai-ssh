const express = require("express");
const axios = require("axios");
const pool = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');
const TelegramService = require('../services/telegramService');
const router = express.Router();

const QUOTA_BY_IP_LIMIT = {
  1: 200, 2: 400, 4: 600
};

const calculateQuotaFromIPLimit = (ipLimit) => QUOTA_BY_IP_LIMIT[ipLimit] || 200;

router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { username, password, protocol, duration, ip_limit, serverId, idempotencyKey } = req.body;

  // Validasi berbeda untuk zivpn (tidak perlu username)
  if (protocol === 'zivpn') {
    if (!password || !protocol || !duration || !ip_limit || !serverId) {
      return res.status(400).json({ success: false, message: "Parameter tidak lengkap" });
    }
  } else {
    if (!username || !protocol || !duration || !ip_limit || !serverId) {
      return res.status(400).json({ success: false, message: "Parameter tidak lengkap" });
    }
  }

  const calculatedQuota = calculateQuotaFromIPLimit(ip_limit);
  let totalCost;
  let userRole;

  try {
    userRole = await BalanceService.getUserRole(userId);
    totalCost = await BalanceService.calculateServerAccountCost(ip_limit, duration, userRole, serverId);
    
    const balanceCheck = await BalanceService.validateSufficientBalance(userId, totalCost);
    if (!balanceCheck.sufficient) {
      return res.status(400).json({
        success: false,
        message: `Saldo tidak mencukupi. Dibutuhkan Rp${totalCost.toLocaleString('id-ID')}, saldo Anda Rp${balanceCheck.currentBalance.toLocaleString('id-ID')}.`,
        data: { required: totalCost, current: balanceCheck.currentBalance, shortage: balanceCheck.shortage }
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Gagal memvalidasi saldo' });
  }

  const connection = await pool.getConnection();
  const lockName = `create:${userId}:${serverId}:${protocol}:${username || password || 'anon'}`;
  const lockTimeoutSeconds = 10;
  let lockAcquired = false;
  try {
    const [lockRows] = await connection.query("SELECT GET_LOCK(?, ?) AS got_lock", [lockName, lockTimeoutSeconds]);
    lockAcquired = lockRows?.[0]?.got_lock === 1;
    if (!lockAcquired) {
      connection.release();
      return res.status(429).json({ success: false, message: 'Permintaan sedang diproses. Coba lagi beberapa saat.' });
    }

    // 1. Idempotency Check
    if (idempotencyKey) {
      const [existingTrx] = await connection.query(
        "SELECT reference_id FROM balance_transactions WHERE idempotency_key = ? AND user_id = ?",
        [idempotencyKey, userId]
      );
      if (existingTrx.length > 0) {
        const accountId = existingTrx[0].reference_id;
        const [accs] = await connection.query("SELECT * FROM vpn_account WHERE id = ?", [accountId]);
        return res.json({
          success: true,
          message: "Akun sudah berhasil dibuat sebelumnya (Idempotent).",
          data: accs[0]
        });
      }
    }

    // 2. Anti-Spam Check (Prevent identical account within 30 seconds)
    const [recentTrx] = await connection.query(
      `SELECT bt.reference_id FROM balance_transactions bt
       JOIN vpn_account va ON bt.reference_id = va.id
       WHERE bt.user_id = ? AND bt.reference_type = 'account_creation'
       AND va.server_id = ? AND va.protocol = ? AND va.username = ?
       AND bt.created_at > DATE_SUB(NOW(), INTERVAL 30 SECOND)`,
      [userId, serverId, protocol, username || password]
    );
    if (recentTrx.length > 0) {
      const accountId = recentTrx[0].reference_id;
      const [accs] = await connection.query("SELECT * FROM vpn_account WHERE id = ?", [accountId]);
      return res.json({
        success: true,
        message: "Akun dengan detail yang sama baru saja dibuat. Silakan cek daftar akun Anda.",
        data: accs[0]
      });
    }

    await connection.beginTransaction();

    const [servers] = await connection.query("SELECT * FROM Server WHERE id = ?", [serverId]);
    const server = servers[0];

    if (!server) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Server tidak ditemukan" });
    }

    const [countResult] = await connection.query("SELECT COUNT(*) as active_count FROM vpn_account WHERE server_id = ? AND expired_date > NOW()", [serverId]);
    if (countResult[0].active_count >= server.batas_create_akun) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: `Server ${server.nama_server} telah mencapai batas maksimum akun aktif.` });
    }

    const port = server.domain.includes("-upc.") ? 8443 : 5888;
    
    let endpoint;
    if (protocol === 'zivpn') {
      // Endpoint khusus untuk zivpn: /create/zivpn?password=xxx&exp=xxx&iplimit=xxx&auth=xxx
      endpoint = `http://${server.domain}:${port}/create/zivpn?password=${password}&exp=${duration}&iplimit=${ip_limit}&auth=${server.auth}`;
    } else {
      endpoint = `http://${server.domain}:${port}/create${protocol}?user=${username}` +
        (protocol === "ssh" ? `&password=${password || "123"}` : "") +
        `&exp=${duration}&quota=${calculatedQuota}&iplimit=${ip_limit}&auth=${server.auth}`;
    }

    const response = await axios.get(endpoint);
    const data = response.data;

    if (data.status !== "success") {
      throw new Error(data.message);
    }

    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + duration);
    
    // Handle response berdasarkan protokol
    let serverUsername, responseData;

    if (protocol === 'zivpn') {
      let finalPassword;

      // Coba parse format baru: "... Account '[user]' created with password '[pass]' ..."
      const newFormatMatch = data.message.match(/Account '([^']+)' created with password '([^']+)'/);
      if (newFormatMatch) {
        serverUsername = newFormatMatch[1];
        finalPassword = newFormatMatch[2];
      } else {
        // Coba parse format lama: "... account '[pass]' created ..."
        const oldFormatMatch = data.message.match(/account '([^']+)'/);
        if (oldFormatMatch) {
          serverUsername = oldFormatMatch[1]; // Di format lama, username dan password sama
          finalPassword = oldFormatMatch[1];
        } else {
          // Fallback jika tidak ada format yang cocok
          serverUsername = password;
          finalPassword = password;
        }
      }

      responseData = {
        password: finalPassword,
        domain: server.domain,
        expired: `${duration} hari`,
        ip_limit: ip_limit.toString(),
        quota: calculatedQuota.toString()
      };
    } else {
      serverUsername = data.data.username || username;
      responseData = data.data;
    }

    let dbData = {
      username: serverUsername,
      password: protocol === 'zivpn' ? responseData.password : (protocol === 'ssh' ? (responseData.password || password) : null),
      protocol, server_id: serverId, duration, quota: calculatedQuota, ip_limit, user_id: userId, expired_date: expiredDate,
      ssh_ws_port: responseData.ssh_ws_port, 
      ssh_ssl_port: responseData.ssh_ssl_port,
      uuid: responseData.uuid, 
      ns_domain: responseData.ns_domain,
      vmess_tls_link: responseData.vmess_tls_link, 
      vmess_nontls_link: responseData.vmess_nontls_link, 
      vmess_grpc_link: responseData.vmess_grpc_link,
      vless_tls_link: responseData.vless_tls_link, 
      vless_nontls_link: responseData.vless_nontls_link, 
      vless_grpc_link: responseData.vless_grpc_link,
      trojan_tls_link: responseData.trojan_tls_link, 
      trojan_nontls_link1: responseData.trojan_nontls_link1, 
      trojan_grpc_link: responseData.trojan_grpc_link,
      zivpn_link: null,
    };

    const columns = Object.keys(dbData).filter(key => dbData[key] !== null && dbData[key] !== undefined);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(key => dbData[key]);

    // INSERT vpn_account terlebih dahulu untuk mendapatkan ID
    const [insertResult] = await connection.query(`INSERT INTO vpn_account (${columns.join(', ')}) VALUES (${placeholders})`, values);
    const vpnAccountId = insertResult.insertId;

    // Deduct balance dengan reference_id yang merujuk ke vpn_account
    const deductResult = await BalanceService.deductBalance(
      userId, totalCost, `Pembuatan akun ${protocol.toUpperCase()}: ${serverUsername}`, 'account_creation', vpnAccountId, connection, idempotencyKey
    );

    await connection.query("UPDATE Server SET total_create_akun = total_create_akun + 1 WHERE id = ?", [serverId]);

    await connection.commit();

    const dailyPrice = await BalanceService.getDailyPrice(ip_limit, userRole, serverId);

    try {
      const telegramService = new TelegramService();
      await telegramService.notifyAccountCreation({
        username: req.user.username, accountName: serverUsername, protocol: protocol.toUpperCase(),
        serverName: server.nama_server, userRole, duration, totalCost,
      });
    } catch (telegramError) {
      console.error('[TelegramService] Failed to send account creation notification:', telegramError.message);
    }

    res.json({
      success: true,
      message: `${data.message} | Biaya: Rp${totalCost.toLocaleString('id-ID')}`,
      data: { ...responseData, username: serverUsername, quota: calculatedQuota, cost: totalCost, dailyPrice, userRole, newBalance: deductResult.balanceAfter }
    });

  } catch (error) {
    await connection.rollback();
    console.error("[CreateAccount] Error:", error.message);

    res.status(500).json({ success: false, message: error.message || "Gagal membuat akun" });
  } finally {
    if (lockAcquired) {
      try {
        await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
      } catch (releaseError) {
        console.error('[CreateAccount] Failed to release lock:', releaseError.message);
      }
    }
    connection.release();
  }
});

module.exports = router;
