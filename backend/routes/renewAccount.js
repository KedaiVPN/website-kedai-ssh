const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');
const TelegramService = require('../services/telegramService');

async function renewAccountOnServer(protocol, identifier, exp, quota, limitip, server) {
  // Validasi identifier, kecuali untuk zivpn yang passwordnya digenerate server
  if (protocol !== 'zivpn' && (/\s/.test(identifier) || /[^a-zA-Z0-9]/.test(identifier))) {
    throw new Error('❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.');
  }

  const port = server.domain.includes("-upc.") ? 8443 : 5888;
  const renewalEndpoints = {
    ssh: `renewssh?user=${identifier}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    vmess: `renewvmess?user=${identifier}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    vless: `renewvless?user=${identifier}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    trojan: `renewtrojan?user=${identifier}&exp=${exp}&quota=${quota}&iplimit=${limitip}`,
    zivpn: `renew/zivpn?password=${identifier}&exp=${exp}`
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
  const lockName = `renew:${userId}:${accountId}`;
  const lockTimeoutSeconds = 10;
  let lockAcquired = false;

  try {
    const [lockRows] = await connection.query("SELECT GET_LOCK(?, ?) AS got_lock", [lockName, lockTimeoutSeconds]);
    lockAcquired = lockRows?.[0]?.got_lock === 1;
    if (!lockAcquired) {
      connection.release();
      return res.status(429).json({ success: false, message: 'Permintaan sedang diproses. Coba lagi beberapa saat.' });
    }

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

    const { username, password, protocol, server_id, quota, ip_limit } = account;
    const userRole = await BalanceService.getUserRole(userId);
    const renewalCost = await BalanceService.calculateServerAccountCost(ip_limit, duration, userRole, server_id);

    await BalanceService.validateSufficientBalance(userId, renewalCost, connection);
    await BalanceService.deductBalance(
      userId, renewalCost, `Perpanjang akun ${protocol.toUpperCase()} - ${username} (${duration} hari) - ${userRole.toUpperCase()}`,
      'account_renewal', accountId, connection
    );

    let exp_param = duration;
    if (protocol === 'ssh') {
        const currentExpiry = new Date(account.expired_date);
        const now = new Date();
        const startDate = currentExpiry > now ? currentExpiry : now;

        const newExpiry = new Date(startDate);
        newExpiry.setDate(newExpiry.getDate() + duration);

        // Format to YYYY-MM-DD
        exp_param = newExpiry.toISOString().split('T')[0];
    }

    // Untuk zivpn, gunakan 'password' sebagai identifier, untuk yang lain gunakan 'username'
    const identifier = protocol === 'zivpn' ? password : username;
    const renewResult = await renewAccountOnServer(protocol, identifier, exp_param, quota, ip_limit, account);

    let newExpiredDate;
    if (protocol === 'ssh' || protocol === 'zivpn') {
      // For SSH and ZiVPN, calculate expiry date manually
      const currentExpiry = new Date(account.expired_date);
      const now = new Date();
      const startDate = currentExpiry > now ? currentExpiry : now;

      const finalNewExpiry = new Date(startDate);
      finalNewExpiry.setDate(finalNewExpiry.getDate() + duration);
      newExpiredDate = finalNewExpiry;
    } else {
      newExpiredDate = renewResult.data.expired;
    }

    await connection.query(
      'UPDATE vpn_account SET expired_date = ?, duration = ? WHERE id = ?',
      [newExpiredDate, duration, accountId]
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
        expired_date: newExpiredDate, // Send back the correct date
        duration, quota, ip_limit, cost: renewalCost, userRole, balance_deducted: renewalCost
      }
    });

  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    if (lockAcquired) {
      try {
        await connection.query("SELECT RELEASE_LOCK(?)", [lockName]);
      } catch (releaseError) {
        console.error('[RenewAccount] Failed to release lock:', releaseError.message);
      }
    }
    connection.release();
  }
});

module.exports = router;
