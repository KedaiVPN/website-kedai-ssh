const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');
const TelegramService = require('../services/telegramService');
const pool = require('../db/connection');

/**
 * A consolidated helper function to call the external renewal API.
 * This function does not interact with the database.
 */
async function callRenewApi(server, account, duration) {
  const endpointMap = {
    ssh: 'renewssh',
    vmess: 'renewvmess',
    vless: 'renewvless',
    trojan: 'renewtrojan'
  };
  const endpoint = endpointMap[account.protocol];
  if (!endpoint) {
    throw new Error(`Protocol tidak didukung: ${account.protocol}`);
  }

  const port = server.domain.includes("-upc.") ? 8443 : 5888;
  const params = new URLSearchParams({
    user: account.username,
    exp: duration,
    iplimit: account.ip_limit,
    quota: account.quota,
    auth: server.auth
  });

  const apiURL = `http://${server.domain}:${port}/${endpoint}?${params.toString()}`;
  console.log(`[RenewAccount] Calling API: ${apiURL}`);
  
  const response = await axios.get(apiURL);
  if (response.data.status !== 'success') {
    throw new Error(`Gagal memperpanjang di server: ${response.data.message}`);
  }
  return response.data;
}

router.post('/', authenticateToken, async (req, res) => {
  const { accountId, duration } = req.body;
  const userId = req.user.id;
  let connection;

  if (!accountId || !duration || duration <= 0) {
    return res.status(400).json({ success: false, message: "ID Akun dan durasi perpanjangan diperlukan." });
  }

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Lock and retrieve all necessary records in one go
    const query = `
      SELECT
        va.*,
        s.domain, s.auth, s.nama_server,
        u.balance, u.role
      FROM vpn_account va
      JOIN Server s ON va.server_id = s.id
      JOIN users u ON va.user_id = u.id
      WHERE va.id = ? AND va.user_id = ?
      FOR UPDATE;
    `;
    const [rows] = await connection.execute(query, [accountId, userId]);
    const accountInfo = rows[0];

    if (!accountInfo) {
      throw new Error('Akun tidak ditemukan atau Anda tidak memiliki izin.');
    }

    // Step 2: Perform business logic checks
    const renewalCost = await BalanceService.calculateCost(accountInfo.ip_limit, duration, accountInfo.role, accountInfo.server_id);
    if (accountInfo.balance < renewalCost) {
      throw new Error(`Saldo tidak mencukupi. Dibutuhkan Rp${renewalCost.toLocaleString('id-ID')}, saldo Anda Rp${accountInfo.balance.toLocaleString('id-ID')}.`);
    }

    // Step 3: Call the external API
    const renewResult = await callRenewApi(accountInfo, accountInfo, duration);
    const newExpiredDate = renewResult.data.expired;
    if (!newExpiredDate) {
        throw new Error('API server tidak mengembalikan tanggal kedaluwarsa yang valid.');
    }

    // Step 4: Perform all database writes
    // 4a. Deduct balance and log transaction
    const balanceAfter = accountInfo.balance - renewalCost;
    await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);
    await connection.execute(
      `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'debit', ?, ?, 'account_renewal', ?, ?, ?)`,
      [userId, renewalCost, `Perpanjang akun ${accountInfo.protocol.toUpperCase()}: ${accountInfo.username}`, accountId, accountInfo.balance, balanceAfter]
    );

    // 4b. Update the account's expiration date
    await connection.execute('UPDATE vpn_account SET expired_date = ? WHERE id = ?', [newExpiredDate, accountId]);

    // Step 5: Commit the transaction
    await connection.commit();

    // Step 6: Send notifications and response after successful commit
    const telegramService = new TelegramService();
    telegramService.notifyAccountRenewal({
      username: req.user.username,
      userRole: accountInfo.role,
      accountName: accountInfo.username,
      serverName: accountInfo.nama_server,
      protocol: accountInfo.protocol.toUpperCase(),
      duration: duration
    }).catch(e => console.error('[TelegramService] Failed to send renewal notification:', e.message));

    res.json({
      success: true,
      message: `${renewResult.message} | Biaya: Rp${renewalCost.toLocaleString('id-ID')}`,
      data: {
        expired_date: newExpiredDate,
        cost: renewalCost,
        newBalance: balanceAfter
      }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[RenewAccount] Transaction failed:', error);
    res.status(400).json({ success: false, message: error.message || 'Gagal memperpanjang akun.' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
