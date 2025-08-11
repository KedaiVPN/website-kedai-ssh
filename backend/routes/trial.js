
const express = require('express');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

// Database connection
const db = new sqlite3.Database('./sellvpn.db');

// Helper function to call trial endpoints
async function callTrialEndpoint(domain, auth, protocol) {
  const endpoints = {
    ssh: `/trialssh?auth=${auth}`,
    vmess: `/trialvmess?auth=${auth}`,
    vless: `/trialvless?auth=${auth}`,
    trojan: `/trialtrojan?auth=${auth}`
  };

  const endpoint = endpoints[protocol];
  if (!endpoint) {
    throw new Error(`Protocol ${protocol} tidak didukung`);
  }

  const url = `http://${domain}:5888${endpoint}`;
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
    // Get server details from database
    const server = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, row) => {
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

    console.log(`Creating trial ${protocol} account on server: ${server.name}`);

    // Call the trial endpoint
    const apiResponse = await callTrialEndpoint(server.domain, server.auth, protocol);

    if (apiResponse.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: apiResponse.message || 'Gagal membuat akun trial'
      });
    }

    // Transform the response to match AccountData interface
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
