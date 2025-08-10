
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

        // Get user role for role-based refund calculation
        let userRole = 'member';
        try {
          userRole = await BalanceService.getUserRole(userId);
          console.log(`[DELETE ACCOUNT] User ${userId} role: ${userRole}`);
        } catch (roleError) {
          console.error('[DELETE ACCOUNT] Failed to get user role, defaulting to member:', roleError.message);
          // Continue with member pricing as fallback
        }

        const apiURL = `http://${server.domain}:5888/${endpoint}?user=${username}&auth=${server.auth}`;
        console.log('🛠️ DEBUG INFO:');
        console.log(`- Jenis akun   : ${protocol}`);
        console.log(`- Username     : ${username}`);
        console.log(`- Server domain: ${server.domain}`);
        console.log(`- User role    : ${userRole}`);
        console.log(`- Endpoint     : ${endpoint}`);
        console.log(`- Full URL     : ${apiURL}`);

        try {
          const response = await axios.get(apiURL);

          if (response.data.status !== 'success') {
            db.close();
            return reject(`❌ Gagal menghapus akun di server: ${response.data.message}`);
          }

          // Calculate remaining days and refund amount based on user role
          const expiredDate = dayjs(expired_date);
          const now = dayjs();
          let sisaHari = Math.ceil(expiredDate.diff(now, 'millisecond') / (1000 * 60 * 60 * 24));
          if (sisaHari < 0) sisaHari = 0;

          // Calculate role-based refund
          let refundAmount = 0;
          if (sisaHari > 0) {
            try {
              // Get role-based daily price
              const dailyPrice = await BalanceService.getDailyPrice(ip_limit, userRole, server_id);
              refundAmount = dailyPrice * sisaHari;
              
              console.log(`[DELETE ACCOUNT] Refund calculation:`);
              console.log(`- IP Limit: ${ip_limit}`);
              console.log(`- User Role: ${userRole}`);
              console.log(`- Daily Price: Rp${dailyPrice} (role-based)`);
              console.log(`- Remaining Days: ${sisaHari}`);
              console.log(`- Total Refund: Rp${refundAmount}`);
            } catch (priceError) {
              console.error('[DELETE ACCOUNT] Error calculating role-based refund:', priceError);
              // Continue without refund if price calculation fails
            }
          }

          db.run('DELETE FROM vpn_account WHERE id = ?', [accountId], async (err3) => {
            if (err3) {
              db.close();
              return reject('❌ Gagal menghapus akun dari database.');
            }

            // Add role-based refund to user balance if there's remaining time
            if (refundAmount > 0) {
              try {
                const refundResult = await BalanceService.addBalance(
                  userId,
                  refundAmount,
                  `Refund penghapusan akun ${protocol.toUpperCase()} - ${username} (${sisaHari} hari, ${userRole})`,
                  'account_refund',
                  accountId
                );
                console.log(`[DELETE ACCOUNT] Balance refunded: Rp${refundAmount} (${userRole} pricing), new balance: Rp${refundResult.balanceAfter}`);
              } catch (refundError) {
                console.error('[DELETE ACCOUNT] Failed to process refund:', refundError);
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
            const roleText = userRole === 'reseller' ? ' (harga reseller)' : '';
            resolve({
              success: true,
              message: `✅ Akun ${protocol.toUpperCase()} berhasil dihapus.\n🕒 Sisa hari: ${sisaHari}${refundAmount > 0 ? `\n💰 Refund: Rp${refundAmount.toLocaleString('id-ID')}${roleText}` : ''}`,
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

    console.log(`[DELETE ACCOUNT] Deleting account ${accountId} for user ${userId}`);

    const result = await hapusAkun(parseInt(accountId), userId);
    
    res.json(result);
  } catch (error) {
    console.error('[DELETE ACCOUNT] Delete account error:', error);
    res.status(400).json({
      success: false,
      message: typeof error === 'string' ? error : 'Failed to delete account'
    });
  }
});

module.exports = router;
