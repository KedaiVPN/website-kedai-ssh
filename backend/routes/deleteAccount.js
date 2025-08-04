
const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const { authenticateToken } = require('../middleware/auth');

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

      const { username, protocol, server_id, duration, expired_date } = account;

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

          // Calculate remaining days and potential refund
          const expiredDate = dayjs(expired_date);
          const now = dayjs();
          let sisaHari = Math.ceil(expiredDate.diff(now, 'millisecond') / (1000 * 60 * 60 * 24));
          if (sisaHari < 0) sisaHari = 0;

          // For now, we don't have a price system, so no refund calculation
          // const refund = price * sisaHari;

          db.run('DELETE FROM vpn_account WHERE id = ?', [accountId], (err3) => {
            if (err3) {
              db.close();
              return reject('❌ Gagal menghapus akun dari database.');
            }

            // If you have a saldo system, uncomment this:
            // db.run('UPDATE users SET saldo = saldo + ? WHERE id = ?', [refund, userId], (err4) => {
            //   if (err4) {
            //     db.close();
            //     return reject('❌ Gagal mengembalikan saldo pengguna.');
            //   }
            //   db.close();
            //   resolve(`✅ Akun ${protocol.toUpperCase()} berhasil dihapus.\n🕒 Sisa hari: ${sisaHari}\n💰 Saldo dikembalikan: Rp${refund.toLocaleString('id-ID')}`);
            // });

            db.close();
            resolve({
              success: true,
              message: `✅ Akun ${protocol.toUpperCase()} berhasil dihapus.\n🕒 Sisa hari: ${sisaHari}`,
              sisaHari
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
