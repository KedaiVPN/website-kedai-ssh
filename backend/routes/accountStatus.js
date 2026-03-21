const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

router.get('/:accountId/status', authenticateToken, async (req, res) => {
  const accountId = req.params.accountId;
  const userId = req.user.id;
  let connection;

  try {
    connection = await pool.getConnection();

    // 1. Ambil data akun dan server terkait dari database
    const [accounts] = await connection.query(
      `SELECT va.id, va.username, va.protocol, s.domain, s.auth
       FROM vpn_account va
       LEFT JOIN Server s ON va.server_id = s.id
       WHERE va.id = ? AND va.user_id = ?`,
      [accountId, userId]
    );

    const account = accounts[0];

    if (!account) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan atau Anda tidak memiliki akses' });
    }

    if (account.protocol === 'zivpn') {
      return res.status(400).json({ success: false, message: 'Pengecekan status tidak didukung untuk protokol zivpn' });
    }

    if (!account.domain || !account.auth) {
      return res.status(500).json({ success: false, message: 'Data server tidak lengkap untuk pengecekan status' });
    }

    // 2. Tentukan Port, Endpoint, dan Username berdasarkan protokol
    const port = account.domain.includes("-upc.") ? 8443 : 5888;

    let endpoint = '';
    if (account.protocol === 'ssh') {
      endpoint = 'statusssh';
    } else if (account.protocol === 'vmess') {
      endpoint = 'statusvmess';
    } else if (account.protocol === 'vless') {
      endpoint = 'statusvless';
    } else if (account.protocol === 'trojan') {
      endpoint = 'statustrojan';
    } else {
      return res.status(400).json({ success: false, message: 'Protokol tidak didukung' });
    }

    // 3. Bangun URL untuk API Remote Server
    // Format URL: http://DOMAIN_SERVER:PORT/endpoint?user=USERNAME&auth=KODE_AUTH
    const url = `http://${account.domain}:${port}/${endpoint}?user=${account.username}&auth=${account.auth}`;

    // 4. Hit endpoint VPS dengan timeout 10 detik agar tidak hang
    const response = await axios.get(url, { timeout: 10000 });

    if (response.data && response.data.status === 'success') {
      return res.json({
        success: true,
        data: response.data.data
      });
    } else {
      console.error('[AccountStatus] VPS returned error:', response.data);
      return res.status(500).json({
        success: false,
        message: response.data?.message || 'Gagal mengambil status dari server VPN'
      });
    }

  } catch (error) {
    console.error('[AccountStatus] Error fetching status:', error.message);
    let errorMessage = 'Terjadi kesalahan saat mengecek status akun';

    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = 'Waktu habis saat menghubungi server VPN (Timeout)';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Koneksi ke server VPN ditolak (Connection Refused)';
    } else if (error.response && error.response.status === 404) {
      errorMessage = 'Endpoint status tidak ditemukan di server VPN';
    }

    return res.status(500).json({ success: false, message: errorMessage });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;