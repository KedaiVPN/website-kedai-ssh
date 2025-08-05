
const express = require('express');
const router = express.Router();
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

// Database connection
const dbPath = path.join(__dirname, '../db/database.sqlite');

// Renew functions adapted for the existing database structure
async function renewssh(username, exp, limitip, serverId) {
  console.log(`Renewing SSH account for ${username} with expiry ${exp} days, limit IP ${limitip} on server ${serverId}`);
  
  // Validasi username
  if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
    return { success: false, message: '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.' };
  }

  // Ambil domain dari database
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
      if (err) {
        console.error('Error fetching server:', err.message);
        db.close();
        return resolve({ success: false, message: '❌ Server tidak ditemukan. Silakan coba lagi.' });
      }

      if (!server) {
        db.close();
        return resolve({ success: false, message: '❌ Server tidak ditemukan. Silakan coba lagi.' });
      }

      const domain = server.domain;
      const auth = server.auth;
      const param = `:5888/renewssh?user=${username}&exp=${exp}&iplimit=${limitip}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      
      axios.get(url)
        .then(response => {
          db.close();
          if (response.data.status === "success") {
            const sshData = response.data.data;
            return resolve({
              success: true,
              data: sshData,
              message: `✅ Akun ${username} berhasil diperbarui`
            });
          } else {
            console.log('Error renewing SSH account');
            return resolve({ success: false, message: `❌ Terjadi kesalahan: ${response.data.message}` });
          }
        })
        .catch(error => {
          console.error('Error saat memperbarui SSH:', error);
          db.close();
          return resolve({ success: false, message: '❌ Terjadi kesalahan saat memperbarui SSH. Silakan coba lagi nanti.' });
        });
    });
  });
}

async function renewvmess(username, exp, quota, limitip, serverId) {
  console.log(`Renewing VMess account for ${username} with expiry ${exp} days, quota ${quota} GB, limit IP ${limitip} on server ${serverId}`);
  
  if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
    return { success: false, message: '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.' };
  }

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
      if (err) {
        console.error('Error fetching server:', err.message);
        db.close();
        return resolve({ success: false, message: '❌ Server tidak ditemukan. Silakan coba lagi.' });
      }

      if (!server) {
        db.close();
        return resolve({ success: false, message: '❌ Server tidak ditemukan. Silakan coba lagi.' });
      }

      const domain = server.domain;
      const auth = server.auth;
      const param = `:5888/renewvmess?user=${username}&exp=${exp}&quota=${quota}&iplimit=${limitip}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      
      axios.get(url)
        .then(response => {
          db.close();
          if (response.data.status === "success") {
            const vmessData = response.data.data;
            return resolve({
              success: true,
              data: vmessData,
              message: `✅ Akun ${username} berhasil diperbarui`
            });
          } else {
            console.log('Error renewing VMess account');
            return resolve({ success: false, message: `❌ Terjadi kesalahan: ${response.data.message}` });
          }
        })
        .catch(error => {
          console.error('Error saat memperbarui VMess:', error);
          db.close();
          return resolve({ success: false, message: '❌ Terjadi kesalahan saat memperbarui VMess. Silakan coba lagi nanti.' });
        });
    });
  });
}

async function renewvless(username, exp, quota, limitip, serverId) {
  console.log(`Renewing VLess account for ${username} with expiry ${exp} days, quota ${quota} GB, limit IP ${limitip} on server ${serverId}`);
  
  if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
    return { success: false, message: '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.' };
  }

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
      if (err) {
        console.error('Error fetching server:', err.message);
        db.close();
        return resolve({ success: false, message: '❌ Server tidak ditemukan. Silakan coba lagi.' });
      }

      if (!server) {
        db.close();
        return resolve({ success: false, message: '❌ Server tidak ditemukan. Silakan coba lagi.' });
      }

      const domain = server.domain;
      const auth = server.auth;
      const param = `:5888/renewvless?user=${username}&exp=${exp}&quota=${quota}&iplimit=${limitip}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      
      axios.get(url)
        .then(response => {
          db.close();
          if (response.data.status === "success") {
            const vlessData = response.data.data;
            return resolve({
              success: true,
              data: vlessData,
              message: `✅ Akun ${username} berhasil diperbarui`
            });
          } else {
            console.log('Error renewing VLess account');
            return resolve({ success: false, message: `❌ Terjadi kesalahan: ${response.data.message}` });
          }
        })
        .catch(error => {
          console.error('Error saat memperbarui VLess:', error);
          db.close();
          return resolve({ success: false, message: '❌ Terjadi kesalahan saat memperbarui VLess. Silakan coba lagi nanti.' });
        });
    });
  });
}

async function renewtrojan(username, exp, quota, limitip, serverId) {
  console.log(`Renewing Trojan account for ${username} with expiry ${exp} days, quota ${quota} GB, limit IP ${limitip} on server ${serverId}`);
  
  if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
    return { success: false, message: '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.' };
  }

  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
      if (err) {
        console.error('Error fetching server:', err.message);
        db.close();
        return resolve({ success: false, message: '❌ Server tidak ditemukan. Silakan coba lagi.' });
      }

      if (!server) {
        db.close();
        return resolve({ success: false, message: '❌ Server tidak ditemukan. Silakan coba lagi.' });
      }

      const domain = server.domain;
      const auth = server.auth;
      const param = `:5888/renewtrojan?user=${username}&exp=${exp}&quota=${quota}&iplimit=${limitip}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      
      axios.get(url)
        .then(response => {
          db.close();
          if (response.data.status === "success") {
            const trojanData = response.data.data;
            return resolve({
              success: true,
              data: trojanData,
              message: `✅ Akun ${username} berhasil diperbarui`
            });
          } else {
            console.log('Error renewing Trojan account');
            return resolve({ success: false, message: `❌ Terjadi kesalahan: ${response.data.message}` });
          }
        })
        .catch(error => {
          console.error('Error saat memperbarui Trojan:', error);
          db.close();
          return resolve({ success: false, message: '❌ Terjadi kesalahan saat memperbarui Trojan. Silakan coba lagi nanti.' });
        });
    });
  });
}

// POST /api/renew
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { accountId, duration } = req.body; // Only get accountId and duration
    const userId = req.user.id;

    console.log(`Renewing account ${accountId} for user ${userId} with duration ${duration} days`);

    const db = new sqlite3.Database(dbPath);

    // Get account details including current quota and ip_limit
    db.get(`
      SELECT va.*, s.id as server_id, s.domain, s.auth 
      FROM vpn_account va
      LEFT JOIN Server s ON va.server_id = s.id
      WHERE va.id = ? AND va.user_id = ?
    `, [accountId, userId], async (err, account) => {
      if (err) {
        console.error('Database error:', err);
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }

      if (!account) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Account not found'
        });
      }

      let renewResult;
      const { username, protocol, server_id, quota, ip_limit } = account;

      console.log(`Using existing settings - Quota: ${quota} GB, IP Limit: ${ip_limit}`);

      // Call appropriate renew function based on protocol using existing quota and ip_limit
      switch (protocol) {
        case 'ssh':
          renewResult = await renewssh(username, duration, ip_limit, server_id);
          break;
        case 'vmess':
          renewResult = await renewvmess(username, duration, quota, ip_limit, server_id);
          break;
        case 'vless':
          renewResult = await renewvless(username, duration, quota, ip_limit, server_id);
          break;
        case 'trojan':
          renewResult = await renewtrojan(username, duration, quota, ip_limit, server_id);
          break;
        default:
          db.close();
          return res.status(400).json({
            success: false,
            message: 'Unsupported protocol'
          });
      }

      if (!renewResult.success) {
        db.close();
        return res.status(400).json(renewResult);
      }

      // Update database with new expiry date
      const newExpiredDate = renewResult.data.expired;
      db.run(
        'UPDATE vpn_account SET expired_date = ?, duration = ? WHERE id = ?',
        [newExpiredDate, duration, accountId],
        function(updateErr) {
          db.close();
          if (updateErr) {
            console.error('Error updating account:', updateErr);
            return res.status(500).json({
              success: false,
              message: 'Failed to update account in database'
            });
          }

          res.json({
            success: true,
            message: renewResult.message,
            data: {
              expired_date: newExpiredDate,
              duration,
              quota: quota, // Return existing quota
              ip_limit: ip_limit // Return existing ip_limit
            }
          });
        }
      );
    });

  } catch (error) {
    console.error('Renew account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
