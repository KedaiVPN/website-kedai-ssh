const express = require("express");
const axios = require("axios");
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');
const TelegramService = require('../services/telegramService');
const pool = require('../db/connection');
const router = express.Router();

const QUOTA_BY_IP_LIMIT = {
  1: 200, 2: 400, 4: 600
};
const calculateQuotaFromIPLimit = (ipLimit) => QUOTA_BY_IP_LIMIT[ipLimit] || 200;

router.post("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { username, password, protocol, duration, ip_limit, serverId } = req.body;

  if (!username || !protocol || !duration || !ip_limit || !serverId) {
    return res.status(400).json({ success: false, message: "Parameter tidak lengkap." });
  }

  const calculatedQuota = calculateQuotaFromIPLimit(ip_limit);
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Lock relevant rows and perform all initial checks within the transaction
    const [serverRows] = await connection.execute('SELECT * FROM Server WHERE id = ? FOR UPDATE', [serverId]);
    const server = serverRows[0];
    if (!server) throw new Error("Server tidak ditemukan.");

    const [userRows] = await connection.execute('SELECT * FROM users WHERE id = ? FOR UPDATE', [userId]);
    const user = userRows[0];
    if (!user) throw new Error("User tidak ditemukan.");

    // Check server capacity
    const [activeCountRows] = await connection.execute("SELECT COUNT(*) as active_count FROM vpn_account WHERE server_id = ? AND expired_date > NOW()", [serverId]);
    if (activeCountRows[0].active_count >= server.batas_create_akun) {
      throw new Error(`Server ${server.nama_server} telah mencapai batas maksimum akun aktif.`);
    }

    // Check user balance
    const totalCost = BalanceService.calculateAccountCost(ip_limit, duration, user.role);
    if (user.balance < totalCost) {
      const shortage = totalCost - user.balance;
      throw new Error(`Saldo tidak mencukupi. Dibutuhkan Rp${totalCost.toLocaleString('id-ID')}, saldo Anda Rp${user.balance.toLocaleString('id-ID')}. Kekurangan Rp${shortage.toLocaleString('id-ID')}.`);
    }

    // Step 2: Call the external server API to create the account
    const port = server.domain.includes("-upc.") ? 8443 : 5888;
    const endpoint = `http://${server.domain}:${port}/create${protocol}?user=${username}` +
      (protocol === "ssh" ? `&password=${password || "123"}` : "") +
      `&exp=${duration}&quota=${calculatedQuota}&iplimit=${ip_limit}&auth=${server.auth}`;

    console.log(`[CreateAccount] Calling API: ${endpoint}`);
    const apiResponse = await axios.get(endpoint);

    if (apiResponse.data.status !== "success") {
      throw new Error(`Gagal membuat akun di server: ${apiResponse.data.message}`);
    }
    const apiData = apiResponse.data.data;

    // Step 3: If API call is successful, perform all database writes
    // 3a. Deduct balance and create transaction log
    const balanceAfter = user.balance - totalCost;
    await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);
    await connection.execute(
      `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, balance_before, balance_after) VALUES (?, 'debit', ?, ?, 'account_creation', ?, ?)`,
      [userId, totalCost, `Pembuatan akun ${protocol.toUpperCase()}: ${apiData.username || username}`, user.balance, balanceAfter]
    );

    // 3b. Create the VPN account record
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() + duration);

    const vpnAccountData = {
      username: apiData.username || username,
      password: protocol === "ssh" ? (apiData.password || password || "123") : null,
      protocol, server_id: serverId, duration, quota: calculatedQuota, ip_limit, user_id: userId,
      expired_date: expiredDate, uuid: apiData.uuid, ns_domain: apiData.ns_domain,
      ssh_ws_port: apiData.ssh_ws_port, ssh_ssl_port: apiData.ssh_ssl_port,
      vmess_tls_link: apiData.vmess_tls_link, vmess_nontls_link: apiData.vmess_nontls_link, vmess_grpc_link: apiData.vmess_grpc_link,
      vless_tls_link: apiData.vless_tls_link, vless_nontls_link: apiData.vless_nontls_link, vless_grpc_link: apiData.vless_grpc_link,
      trojan_tls_link: apiData.trojan_tls_link, trojan_nontls_link1: apiData.trojan_nontls_link1, trojan_grpc_link: apiData.trojan_grpc_link,
    };
    const columns = Object.keys(vpnAccountData).filter(k => vpnAccountData[k] != null);
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(k => vpnAccountData[k]);
    await connection.execute(`INSERT INTO vpn_account (${columns.join(', ')}) VALUES (${placeholders})`, values);

    // 3c. Update server and user stats
    await connection.execute('UPDATE Server SET total_create_akun = total_create_akun + 1 WHERE id = ?', [serverId]);
    await connection.execute('UPDATE users SET total_transaksi = total_transaksi + 1, created_vpn = created_vpn + 1 WHERE id = ?', [userId]);

    // Step 4: If all writes succeed, commit the transaction
    await connection.commit();

    // Step 5: Send notifications and response AFTER transaction is committed
    const telegramService = new TelegramService();
    telegramService.notifyAccountCreation({
      username: user.username,
      accountName: vpnAccountData.username,
      protocol: protocol.toUpperCase(),
      serverName: server.nama_server,
      userRole: user.role,
      duration: duration,
      totalCost: totalCost,
    }).catch(e => console.error('[TelegramService] Failed to send notification:', e.message));

    res.json({
      success: true,
      message: `${apiResponse.data.message} | Biaya: Rp${totalCost.toLocaleString('id-ID')}`,
      data: { ...apiData, newBalance: balanceAfter }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[CreateAccount] Transaction failed:', error.message);
    res.status(500).json({ success: false, message: error.message || "Gagal memproses pembuatan akun." });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
