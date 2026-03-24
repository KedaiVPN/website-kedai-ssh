const express = require('express');
const axios = require('axios');
const pool = require('../db/connection');
const router = express.Router();

async function callTrialEndpoint(server, protocol) {
  const endpoints = {
    ssh: `/trialssh?auth=${server.auth}`,
    vmess: `/trialvmess?auth=${server.auth}`,
    vless: `/trialvless?auth=${server.auth}`,
    trojan: `/trialtrojan?auth=${server.auth}`,
    zivpn: `/trial/zivpn?exp=30&auth=${server.auth}` // ZiVPN wajib exp=30
  };

  const endpoint = endpoints[protocol];
  if (!endpoint) {
    throw new Error(`Protocol ${protocol} tidak didukung`);
  }

  const port = server.domain.includes("-upc.") ? 8443 : 5888;
  const url = `http://${server.domain}:${port}${endpoint}`;

  try {
    const response = await axios.get(url, { timeout: 30000 });
    return response.data;
  } catch (error) {
    throw new Error(`Gagal membuat akun trial: ${error.message}`);
  }
}

function transformTrialData(apiData, protocol) {
  const baseData = {
    username: apiData.username || apiData.password, // Untuk zivpn, gunakan password sebagai username
    domain: apiData.domain,
    expired: apiData.expired,
    ip_limit: apiData.ip_limit || '0',
    quota: apiData.quota
  };

  switch (protocol) {
    case 'ssh':
      return { ...baseData, password: apiData.password, ssh_ws_port: '80', ssh_ssl_port: '443' };
    case 'vmess':
      return { ...baseData, uuid: apiData.uuid, vmess_tls_link: apiData.vmess_tls_link, vmess_nontls_link: apiData.vmess_nontls_link, vmess_grpc_link: apiData.vmess_grpc_link };
    case 'vless':
      return { ...baseData, uuid: apiData.uuid, ns_domain: apiData.ns_domain, vless_tls_link: apiData.vless_tls_link, vless_nontls_link: apiData.vless_nontls_link, vless_grpc_link: apiData.vless_grpc_link };
    case 'trojan':
      return { ...baseData, uuid: apiData.uuid, trojan_tls_link: apiData.trojan_tls_link, trojan_nontls_link1: apiData.trojan_nontls_link1, trojan_go_link: apiData.trojan_go_link, trojan_grpc_link: apiData.trojan_grpc_link };
    case 'zivpn':
      return { ...baseData, password: apiData.password, username: apiData.password, zivpn_link: apiData.zivpn_link };
    default:
      return baseData;
  }
}

router.post('/', async (req, res) => {
  const { protocol, serverId, turnstileToken } = req.body;

  // Verify Turnstile token
  const { verifyTurnstile } = require('../utils/turnstile');
  const turnstileResult = await verifyTurnstile(turnstileToken, req.ip);
  if (!turnstileResult.success) {
    return res.status(400).json({ success: false, message: 'Verifikasi captcha gagal. Silakan coba lagi.' });
  }

  if (!protocol || !serverId) {
    return res.status(400).json({ success: false, message: 'Protocol dan serverId harus diisi' });
  }

  const validProtocols = ['ssh', 'vmess', 'vless', 'trojan', 'zivpn'];
  if (!validProtocols.includes(protocol)) {
    return res.status(400).json({ success: false, message: 'Protocol tidak valid' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM Server WHERE id = ?', [serverId]);
    const server = rows[0];

    if (!server) {
      return res.status(404).json({ success: false, message: 'Server tidak ditemukan' });
    }

    if (server.status !== 'online') {
      return res.status(400).json({ success: false, message: 'Server sedang tidak tersedia' });
    }

    const apiResponse = await callTrialEndpoint(server, protocol);

    if (apiResponse.status !== 'success') {
      return res.status(400).json({ success: false, message: apiResponse.message || 'Gagal membuat akun trial' });
    }

    let accountData;

    if (protocol === 'zivpn') {
      // ZiVPN trial tidak mengembalikan data object
      // Parse password dari message: "Success: Trial account 'trial48394' created..."
      const passwordMatch = apiResponse.message.match(/Trial account '([^']+)'/);
      const trialPassword = passwordMatch ? passwordMatch[1] : 'unknown';
      
      accountData = {
        username: trialPassword,
        password: trialPassword,
        domain: server.domain,
        expired: '30 menit',
        ip_limit: '1',
        quota: '0'
      };
    } else {
      accountData = transformTrialData(apiResponse.data, protocol);
    }

    res.json({
      success: true,
      message: `Akun trial ${protocol.toUpperCase()} berhasil dibuat`,
      data: accountData
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Terjadi kesalahan saat membuat akun trial' });
  }
});

module.exports = router;
