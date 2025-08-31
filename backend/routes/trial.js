const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const router = express.Router();

// Database connection
const dbPath = path.join(__dirname, '../db/database.sqlite');
const db = new sqlite3.Database(dbPath);

// Helper function to call trial endpoints
async function callTrialEndpoint(server, protocol) {
  const endpoints = {
    ssh: `/trialssh?auth=${server.auth}`,
    vmess: `/trialvmess?auth=${server.auth}`,
    vless: `/trialvless?auth=${server.auth}`,
    trojan: `/trialtrojan?auth=${server.auth}`
  };

  const endpoint = endpoints[protocol];
  if (!endpoint) {
    throw new Error(`Protocol ${protocol} tidak didukung`);
  }

  // 🔑 Tentukan port berdasarkan pola domain (UPC pakai 8443, non-UPC pakai 5888)
  const port = server.domain.includes("-upc.") ? 8443 : 5888;

  const url = `http://${server.domain}:${port}${endpoint}`;
  console.log(`Calling trial endpoint: ${url}`);

  try {
    const response = await axios.get(url, { timeout: 30000 });
    return response.data;
  } catch (error) {
    console.error('Error calling trial endpoint:', error.message);
    throw new Error(`Gagal membuat akun trial: ${error.message}`);
  }
}

// Helper function to transform API response to AccountData format
function transformTrialData(apiData, protocol) {
  const baseData = {
    username: apiData.username,
    domain: apiData.domain,
    expired: apiData.expired,
    ip_limit: apiData.ip_limit || '0',
    quota: apiData.quota
  };

  switch (protocol) {
    case 'ssh':
      return {
        ...baseData,
        password: apiData.password,
        ssh_ws_port: '80',
        ssh_ssl_port: '443'
      };

    case 'vmess':
      return {
        ...baseData,
        uuid: apiData.uuid,
        vmess_tls_link: apiData.vmess_tls_link,
        vmess_nontls_link: apiData.vmess_nontls_link,
        vmess_grpc_link: apiData.vmess_grpc_link
      };

    case 'vless':
      return {
        ...baseData,
        uuid: apiData.uuid,
        ns_domain: apiData.ns_domain,
        vless_tls_link: apiData.vless_tls_link,
        vless_nontls_link: apiData.vless_nontls_link,
        vless_grpc_link: apiData.vless_grpc_link
      };

    case 'trojan':
      return {
        ...baseData,
        uuid: apiData.uuid,
        trojan_tls_link: apiData.trojan_tls_link,
        trojan_nontls_link1: apiData.trojan_nontls_link1,
        trojan_grpc_link: apiData.trojan_grpc_link
      };

    default:
      return baseData;
  }
}

// POST /api/trial - Create trial account
router.post('/', async (req, res) => {
  console.log('Trial account request received:', req.body);

  const { protocol, serverId } = req.body;

  // Validate input
  if (!protocol || !serverId) {
    return res.status(400).json({
      success: false,
      message: 'Protocol dan serverId harus diisi'
    });
  }

  const validProtocols = ['ssh', 'vmess', 'vless', 'trojan'];
  if (!validProtocols.includes(protocol)) {
    return res.status(400).json({
      success: false,
      message: 'Protocol tidak valid'
    });
  }

  try {
    // Ambil detail server dari database
    const server = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM server WHERE id = ?', [serverId], (err, row) => {
        if (err) {
          console.error('Database error:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    if (!server) {
      return res.status(404).json({
        success: false,
        message: 'Server tidak ditemukan'
      });
    }

    if (server.status !== 'online') {
      return res.status(400).json({
        success: false,
        message: 'Server sedang tidak tersedia'
      });
    }

    console.log(`Creating trial ${protocol} account on server: ${server.nama_server}`);

    // Panggil endpoint trial sesuai server & protocol
    const apiResponse = await callTrialEndpoint(server, protocol);

    if (apiResponse.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: apiResponse.message || 'Gagal membuat akun trial'
      });
    }

    // Transformasi data API ke format AccountData
    const accountData = transformTrialData(apiResponse.data, protocol);

    console.log('Trial account created successfully:', accountData.username);

    res.json({
      success: true,
      message: `Akun trial ${protocol.toUpperCase()} berhasil dibuat`,
      data: accountData
    });

  } catch (error) {
    console.error('Error creating trial account:', error);

    res.status(500).json({
      success: false,
      message: error.message || 'Terjadi kesalahan saat membuat akun trial'
    });
  }
});

module.exports = router;
