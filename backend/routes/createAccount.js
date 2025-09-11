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
  const { username, password, protocol, duration, ip_limit, serverId } = req.body;

  if (!username || !protocol || !duration || !ip_limit || !serverId) {
    return res.status(400).json({ success: false, message: "Parameter tidak lengkap" });
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
  try {
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

    const deductResult = await BalanceService.deductBalance(
      userId, totalCost, `Pembuatan akun ${protocol.toUpperCase()}: ${username}`, 'account_creation', null, connection
    );

    const port = server.domain.includes("-upc.") ? 8443 : 5888;
    const endpoint = `http://${server.domain}:${port}/create${protocol}?user=${username}` +
      (protocol === "ssh" ? `&password=${password || "123"}` : "") +
      `&exp=${duration}&quota=${calculatedQuota}&iplimit=${ip_limit}&auth=${server.auth}`;

    const response = await axios.get(endpoint);
    const data = response.data;

    if (data.status !== "success") {
      throw new Error(data.message);
    }

    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + duration);
    const serverUsername = data.data.username || username;

    let dbData = {
      username: serverUsername,
      password: protocol === "ssh" ? (data.data.password || password || "123") : null,
      protocol, server_id: serverId, duration, quota: calculatedQuota, ip_limit, user_id: userId, expired_date: expiredDate,
      ssh_ws_port: data.data.ssh_ws_port, ssh_ssl_port: data.data.ssh_ssl_port,
      uuid: data.data.uuid, ns_domain: data.data.ns_domain,
      vmess_tls_link: data.data.vmess_tls_link, vmess_nontls_link: data.data.vmess_nontls_link, vmess_grpc_link: data.data.vmess_grpc_link,
      vless_tls_link: data.data.vless_tls_link, vless_nontls_link: data.data.vless_nontls_link, vless_grpc_link: data.data.vless_grpc_link,
      trojan_tls_link: data.data.trojan_tls_link, trojan_nontls_link1: data.data.trojan_nontls_link1, trojan_grpc_link: data.data.trojan_grpc_link,
    };

    const columns = Object.keys(dbData).filter(key => dbData[key] !== null && dbData[key] !== undefined);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(key => dbData[key]);

    const [insertResult] = await connection.query(`INSERT INTO vpn_account (${columns.join(', ')}) VALUES (${placeholders})`, values);

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
      data: { ...data.data, username: serverUsername, quota: calculatedQuota, cost: totalCost, dailyPrice, userRole, newBalance: deductResult.balanceAfter }
    });

  } catch (error) {
    await connection.rollback();
    console.error("[CreateAccount] Error:", error.message);

    try {
      await BalanceService.addBalance(userId, totalCost, `Refund: ${error.message}`, 'refund', null);
    } catch (refundError) {
      console.error('[CreateAccount] Failed to refund balance:', refundError);
    }

    res.status(500).json({ success: false, message: error.message || "Gagal membuat akun" });
  } finally {
    connection.release();
  }
});

module.exports = router;
