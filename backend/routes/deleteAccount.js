const express = require('express');
const router = express.Router();
const axios = require('axios');
const dayjs = require('dayjs');
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService'); // Keep for pricing logic
const pool = require('../db/connection');

const deleteEndpointMap = {
  ssh: 'deletessh',
  vmess: 'deletevmess',
  vless: 'deletevless',
  trojan: 'deletetrojan'
};

router.delete('/:accountId', authenticateToken, async (req, res) => {
  const { accountId } = req.params;
  const userId = req.user.id;
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Step 1: Lock and retrieve all necessary records
    const [accountRows] = await connection.execute('SELECT * FROM vpn_account WHERE id = ? AND user_id = ? FOR UPDATE', [accountId, userId]);
    const account = accountRows[0];
    if (!account) throw new Error('Akun tidak ditemukan atau Anda tidak memiliki izin.');

    const [serverRows] = await connection.execute('SELECT * FROM Server WHERE id = ? FOR UPDATE', [account.server_id]);
    const server = serverRows[0];
    if (!server) throw new Error('Server untuk akun ini tidak ditemukan.');

    const [userRows] = await connection.execute('SELECT * FROM users WHERE id = ? FOR UPDATE', [userId]);
    const user = userRows[0];
    if (!user) throw new Error('User tidak ditemukan.');

    // Step 2: Call the external API to delete the account from the VPN server
    const endpoint = deleteEndpointMap[account.protocol];
    if (!endpoint) throw new Error('Jenis akun tidak valid untuk penghapusan.');

    const port = server.domain.includes("-upc.") ? 8443 : 5888;
    const apiURL = `http://${server.domain}:${port}/${endpoint}?user=${account.username}&auth=${server.auth}`;

    console.log(`[DELETE ACCOUNT] Calling API: ${apiURL}`);
    const response = await axios.get(apiURL);

    if (response.data.status !== 'success') {
      throw new Error(`Gagal menghapus akun di server: ${response.data.message}`);
    }

    // Step 3: Perform database writes (refund and delete)
    // Calculate remaining days for refund
    const expiredDate = dayjs(account.expired_date);
    const now = dayjs();
    let sisaHari = Math.ceil(expiredDate.diff(now, 'millisecond') / (1000 * 60 * 60 * 24));
    if (sisaHari < 0) sisaHari = 0;

    let refundAmount = 0;
    if (sisaHari > 0) {
      const dailyPrice = BalanceService.getPriceByIPLimit(account.ip_limit, user.role);
      refundAmount = dailyPrice * sisaHari;
    }

    if (refundAmount > 0) {
      const balanceAfter = user.balance + refundAmount;
      // Add balance back to user
      await connection.execute('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);
      // Create a refund transaction record
      await connection.execute(
        `INSERT INTO balance_transactions (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) VALUES (?, 'credit', ?, ?, 'account_refund', ?, ?, ?)`,
        [userId, refundAmount, `Refund hapus akun ${account.protocol.toUpperCase()}: ${account.username}`, account.id, user.balance, balanceAfter]
      );
      console.log(`[DELETE ACCOUNT] Refund of ${refundAmount} processed for user ${userId}.`);
    }

    // Finally, delete the account record
    await connection.execute('DELETE FROM vpn_account WHERE id = ?', [accountId]);
    console.log(`[DELETE ACCOUNT] Account record ${accountId} deleted from database.`);

    // Step 4: Commit the transaction
    await connection.commit();

    const roleText = user.role === 'reseller' ? ' (harga reseller)' : '';
    res.json({
      success: true,
      message: `✅ Akun ${account.protocol.toUpperCase()} berhasil dihapus.\n🕒 Sisa hari: ${sisaHari}${refundAmount > 0 ? `\n💰 Refund: Rp${refundAmount.toLocaleString('id-ID')}${roleText}` : ''}`,
      sisaHari,
      refund: refundAmount
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('[DELETE ACCOUNT] Transaction failed:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Gagal menghapus akun.'
    });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
