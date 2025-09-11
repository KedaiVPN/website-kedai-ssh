const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');
const TelegramService = require('../services/telegramService');

async function renewAccountOnServer(protocol, username, exp, quota, limitip, server) {
  if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
    throw new Error('❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.');
  }

  const port = server.domain.includes("-upc.") ? 8443 : 5888;
  const renewalEndpoints = {
    ssh: `renewssh?user=${username}&exp=${exp}&iplimit=${limitip}`,
    vmess: `renewvmess?user=${username}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    vless: `renewvless?user=${username}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    trojan: `renewtrojan?user=${username}&exp=${exp}&quota=${quota}&iplimit=${limitip}`
  };

  const endpoint = renewalEndpoints[protocol];
  if (!endpoint) {
    throw new Error('Unsupported protocol');
  }

  const url = `http://${server.domain}:${port}/${endpoint}&auth=${server.auth}`;
  const response = await axios.get(url);

  if (response.data.status !== "success") {
    throw new Error(`❌ Terjadi kesalahan: ${response.data.message}`);
  }
  return response.data;
}

router.post('/', authenticateToken, async (req, res) => {
  const { accountId, duration } = req.body;
  const userId = req.user.id;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [accounts] = await connection.query(
      `SELECT va.*, s.id as server_id, s.domain, s.auth, s.nama_server
       FROM vpn_account va
       LEFT JOIN Server s ON va.server_id = s.id
       WHERE va.id = ? AND va.user_id = ?`,
      [accountId, userId]
    );
    const account = accounts[0];

    if (!account) {
      throw new Error('Account not found');
    }

    const { username, protocol, server_id, quota, ip_limit } = account;
    const userRole = await BalanceService.getUserRole(userId);
    const renewalCost = await BalanceService.calculateServerAccountCost(ip_limit, duration, userRole, server_id);

    await BalanceService.validateSufficientBalance(userId, renewalCost, connection);
    await BalanceService.deductBalance(
      userId, renewalCost, `Perpanjang akun ${protocol.toUpperCase()} - ${username} (${duration} hari) - ${userRole.toUpperCase()}`,
      'account_renewal', accountId, connection
    );

    const renewResult = await renewAccountOnServer(protocol, username, duration, quota, ip_limit, account);

    await connection.query(
      'UPDATE vpn_account SET expired_date = ?, duration = ? WHERE id = ?',
      [renewResult.data.expired, duration, accountId]
    );

    await connection.commit();

    try {
      const telegramService = new TelegramService();
      await telegramService.notifyAccountRenewal({
        username: req.user.username, userRole, accountName: username,
        serverName: account.nama_server, protocol: protocol.toUpperCase(), duration
      });
    } catch (telegramError) {
      console.error('[TelegramService] Failed to send renewal notification:', telegramError.message);
    }

    res.json({
      success: true,
      message: renewResult.message,
      data: {
        expired_date: renewResult.data.expired,
        duration, quota, ip_limit, cost: renewalCost, userRole, balance_deducted: renewalCost
      }
    });

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
