const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const axios = require('axios');
const dayjs = require('dayjs');
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');

const deleteEndpointMap = {
  ssh: 'deletessh',
  vmess: 'deletevmess',
  vless: 'deletevless',
  trojan: 'deletetrojan'
};

async function hapusAkun(accountId, userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [accounts] = await connection.query('SELECT * FROM vpn_account WHERE id = ? AND user_id = ?', [accountId, userId]);
    const account = accounts[0];
    if (!account) {
      throw new Error('❌ Akun tidak ditemukan.');
    }

    const { username, protocol, server_id, expired_date, ip_limit } = account;

    const [servers] = await connection.query('SELECT domain, auth FROM Server WHERE id = ?', [server_id]);
    const server = servers[0];
    if (!server) {
      throw new Error('❌ Server tidak ditemukan.');
    }

    const endpoint = deleteEndpointMap[protocol];
    if (!endpoint) {
      throw new Error('❌ Jenis akun tidak valid untuk penghapusan.');
    }

    const userRole = await BalanceService.getUserRole(userId);
    const port = server.domain.includes("-upc.") ? 8443 : 5888;
    const apiURL = `http://${server.domain}:${port}/${endpoint}?user=${username}&auth=${server.auth}`;

    const response = await axios.get(apiURL);
    if (response.data.status !== 'success') {
      throw new Error(`❌ Gagal menghapus akun di server: ${response.data.message}`);
    }

    const now = dayjs();
    let sisaHari = Math.ceil(dayjs(expired_date).diff(now, 'millisecond') / (1000 * 60 * 60 * 24));
    if (sisaHari < 0) sisaHari = 0;

    let refundAmount = 0;
    if (sisaHari > 0) {
      const dailyPrice = await BalanceService.getDailyPrice(ip_limit, userRole, server_id);
      refundAmount = dailyPrice * sisaHari;
    }

    await connection.query('DELETE FROM vpn_account WHERE id = ?', [accountId]);

    if (refundAmount > 0) {
      await BalanceService.addBalance(
        userId,
        refundAmount,
        `Refund penghapusan akun ${protocol.toUpperCase()} - ${username} (${sisaHari} hari, ${userRole})`,
        'account_refund',
        accountId,
        connection
      );
    }

    await connection.commit();

    const roleText = userRole === 'reseller' ? ' (harga reseller)' : '';
    return {
      success: true,
      message: `✅ Akun ${protocol.toUpperCase()} berhasil dihapus.\n🕒 Sisa hari: ${sisaHari}${refundAmount > 0 ? `\n💰 Refund: Rp${refundAmount.toLocaleString('id-ID')}${roleText}` : ''}`,
      sisaHari,
      refund: refundAmount
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

router.delete('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;
    const result = await hapusAkun(parseInt(accountId), userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete account'
    });
  }
});

module.exports = router;
