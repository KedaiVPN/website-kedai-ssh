
const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');

dayjs.extend(customParseFormat);

// Database connection
const dbPath = path.join(__dirname, '../db/database.sqlite');

const deleteEndpointMap = {
  ssh: 'deletessh',
  vmess: 'deletevmess',
  vless: 'deletevless',
  trojan: 'deletetrojan'
};

async function hapusAkun(accountId, userId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.get('SELECT * FROM vpn_account WHERE id = ? AND user_id = ?', [accountId, userId], async (err, account) => {
      if (err || !account) {
        db.close();
        return reject('❌ Akun tidak ditemukan.');
      }

      const { username, protocol, server_id, duration, expired_date, ip_limit } = account;

      db.get('SELECT domain, auth FROM Server WHERE id = ?', [server_id], async (err2, server) => {
        if (err2 || !server) {
          db.close();
          return reject('❌ Server tidak ditemukan.');
        }

        const endpoint = deleteEndpointMap[protocol];
        if (!endpoint) {
          db.close();
          return reject('❌ Jenis akun tidak valid untuk penghapusan.');
        }

        const apiURL = `http://${server.domain}:5888/${endpoint}?user=${username}&auth=${server.auth}`;
        console.log('🛠️ DEBUG INFO:');
        console.log(`- Jenis akun   : ${protocol}`);
        console.log(`- Username     : ${username}`);
        console.log(`- Server domain: ${server.domain}`);
        console.log(`- Endpoint     : ${endpoint}`);
        console.log(`- Full URL     : ${apiURL}`);

        try {
          const response = await axios.get(apiURL);

          if (response.data.status !== 'success') {
            db.close();
            return reject(`❌ Gagal menghapus akun di server: ${response.data.message}`);
          }

          // Calculate remaining days and refund amount
          const expiredDate = dayjs(expired_date);
          const now = dayjs();
          let sisaHari = Math.ceil(expiredDate.diff(now, 'millisecond') / (1000 * 60 * 60 * 24));
          if (sisaHari < 0) sisaHari = 0;

          // Calculate refund based on remaining days and daily price
          let refundAmount = 0;
          if (sisaHari > 0) {
            try {
              const dailyPrice = BalanceService.getPriceByIPLimit(ip_limit);
              refundAmount = dailyPrice * sisaHari;
              console.log(`Refund calculation: ${dailyPrice} × ${sisaHari} days = Rp${refundAmount}`);
            } catch (priceError) {
              console.error('Error calculating refund:', priceError);
              // Continue without refund if price calculation fails
            }
          }

          db.run('DELETE FROM vpn_account WHERE id = ?', [accountId], async (err3) => {
            if (err3) {
              db.close();
              return reject('❌ Gagal menghapus akun dari database.');
            }

            // Add refund to user balance if there's remaining time
            if (refundAmount > 0) {
              try {
                const refundResult = await BalanceService.addBalance(
                  userId,
                  refundAmount,
                  `Refund penghapusan akun ${protocol.toUpperCase()} - ${username} (${sisaHari} hari)`,
                  'account_refund',
                  accountId
                );
                console.log(`Balance refunded: Rp${refundAmount}, new balance: Rp${refundResult.balanceAfter}`);
              } catch (refundError) {
                console.error('Failed to process refund:', refundError);
                // Continue even if refund fails - account is already deleted
                db.close();
                return resolve({
                  success: true,
                  message: `✅ Akun ${protocol.toUpperCase()} berhasil dihapus.\n🕒 Sisa hari: ${sisaHari}\n❌ Gagal memproses refund: ${refundError.message}`,
                  sisaHari,
                  refund: 0,
                  refundError: refundError.message
                });
              }
            }

            db.close();
            resolve({
              success: true,
              message: `✅ Akun ${protocol.toUpperCase()} berhasil dihapus.\n🕒 Sisa hari: ${sisaHari}${refundAmount > 0 ? `\n💰 Refund: Rp${refundAmount.toLocaleString('id-ID')}` : ''}`,
              sisaHari,
              refund: refundAmount
            });
          });

        } catch (error) {
          db.close();
          reject(`❌ Gagal terhubung ke API server: ${error.message}`);
        }
      });
    });
  });
}

// DELETE /api/delete/:accountId
router.delete('/:accountId', authenticateToken, async (req, res) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;

    console.log(`Deleting account ${accountId} for user ${userId}`);

    const result = await hapusAkun(parseInt(accountId), userId);
    
    res.json(result);
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(400).json({
      success: false,
      message: typeof error === 'string' ? error : 'Failed to delete account'
    });
  }
});

module.exports = router;
