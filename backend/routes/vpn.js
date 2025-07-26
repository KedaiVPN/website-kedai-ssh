const express = require("express");
const axios = require("axios");
const ping = require("ping");
const NodeCache = require("node-cache");
const { v4: uuidv4 } = require("uuid");
const { dbUtils } = require("../config/database");
const { verifyToken } = require("../middleware/auth");
const { validateVPNAccount } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();

// Cache for ping results (60 seconds TTL)
const pingCache = new NodeCache({ stdTTL: 60 });

// Get all available servers
router.get("/servers", async (req, res) => {
  try {
    const servers = await dbUtils.all(`
      SELECT 
        id, name, domain, location, auth, status, protocols, max_users,
        quota, iplimit, batas_create_akun, total_create_akun
      FROM servers 
      WHERE is_active = 1
      ORDER BY name ASC
    `);

    const serversWithPing = await Promise.all(
      servers.map(async (server) => {
        const cacheKey = `ping-${server.domain}`;
        let pingMs = pingCache.get(cacheKey);

        if (pingMs === undefined) {
          try {
            const result = await ping.promise.probe(server.domain, { timeout: 2 });
            pingMs = result.alive ? Number(result.time) : 9999;
            pingCache.set(cacheKey, pingMs);
          } catch (e) {
            console.warn("Ping error to", server.domain, e.message);
            pingMs = 9999;
          }
        }

        // Get real user count from vpn_accounts
        const userCount = await new Promise((resolve) => {
          dbUtils.get(
            `SELECT COUNT(*) as total FROM vpn_accounts WHERE server_id = ? AND status = 'active'`,
            [server.id],
            (err, result) => {
              if (err) {
                console.error("Count user error:", err.message);
                resolve(0);
              } else {
                resolve(result ? result.total : 0);
              }
            }
          );
        });

        return {
          id: server.id.toString(),
          name: server.name,
          domain: server.domain,
          location: server.location || "Unknown",
          auth: server.auth,
          status: server.status || "online",
          protocols: server.protocols
            ? JSON.parse(server.protocols)
            : ["ssh", "vmess", "vless", "trojan"],
          ping: pingMs,
          users: userCount,
          max_users: server.max_users,
          quota: server.quota,
          iplimit: server.iplimit,
          batas_create_akun: server.batas_create_akun,
          total_create_akun: server.total_create_akun,
          available_slots: server.max_users - userCount,
          load_percentage: server.max_users ? Math.round((userCount / server.max_users) * 100) : 0
        };
      })
    );

    res.json(serversWithPing);
  } catch (error) {
    console.error("Get servers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch servers"
    });
  }
});

// Get servers by protocol
router.get("/servers/:protocol", async (req, res) => {
  try {
    const { protocol } = req.params;
    const validProtocols = ['ssh', 'vmess', 'vless', 'trojan'];
    
    if (!validProtocols.includes(protocol)) {
      return res.status(400).json({
        success: false,
        message: "Invalid protocol"
      });
    }

    const servers = await dbUtils.all(`
      SELECT 
        id, name, domain, location, auth, status, protocols, max_users,
        quota, iplimit, batas_create_akun, total_create_akun
      FROM servers 
      WHERE is_active = 1 AND protocols LIKE ?
      ORDER BY name ASC
    `, [`%"${protocol}"%`]);

    const serversWithPing = await Promise.all(
      servers.map(async (server) => {
        const cacheKey = `ping-${server.domain}`;
        let pingMs = pingCache.get(cacheKey);

        if (pingMs === undefined) {
          try {
            const result = await ping.promise.probe(server.domain, { timeout: 2 });
            pingMs = result.alive ? Number(result.time) : 9999;
            pingCache.set(cacheKey, pingMs);
          } catch (e) {
            console.warn("Ping error to", server.domain, e.message);
            pingMs = 9999;
          }
        }

        // Get real user count from vpn_accounts
        const userCount = await new Promise((resolve) => {
          dbUtils.get(
            `SELECT COUNT(*) as total FROM vpn_accounts WHERE server_id = ? AND status = 'active'`,
            [server.id],
            (err, result) => {
              if (err) {
                console.error("Count user error:", err.message);
                resolve(0);
              } else {
                resolve(result ? result.total : 0);
              }
            }
          );
        });

        return {
          id: server.id.toString(),
          name: server.name,
          domain: server.domain,
          location: server.location || "Unknown",
          auth: server.auth,
          status: server.status || "online",
          protocols: server.protocols
            ? JSON.parse(server.protocols)
            : ["ssh", "vmess", "vless", "trojan"],
          ping: pingMs,
          users: userCount,
          max_users: server.max_users,
          quota: server.quota,
          iplimit: server.iplimit,
          batas_create_akun: server.batas_create_akun,
          total_create_akun: server.total_create_akun,
          available_slots: server.max_users - userCount,
          load_percentage: server.max_users ? Math.round((userCount / server.max_users) * 100) : 0
        };
      })
    );

    // Filter servers that support the protocol
    const filteredServers = serversWithPing.filter(server => 
      server.protocols.includes(protocol)
    );

    res.json(filteredServers);
  } catch (error) {
    console.error("Get servers by protocol error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch servers"
    });
  }
});

// Create VPN account (protected route)
router.post("/create-account", verifyToken, validateVPNAccount, async (req, res) => {
  try {
    const { username, protocol, duration, serverId, password, quota, ipLimit } = req.body;
    const userId = req.user.id;

    // Get server details
    const server = await dbUtils.get(
      "SELECT * FROM servers WHERE id = ? AND is_active = 1",
      [serverId]
    );

    if (!server) {
      return res.status(404).json({
        success: false,
        message: "Server not found"
      });
    }

    // Check if server supports the protocol
    const serverProtocols = JSON.parse(server.protocols || '[]');
    if (!serverProtocols.includes(protocol)) {
      return res.status(400).json({
        success: false,
        message: "Server doesn't support this protocol"
      });
    }

    // Check server capacity
    if (server.users >= server.max_users) {
      return res.status(400).json({
        success: false,
        message: "Server is at full capacity"
      });
    }

    // Check account creation limit
    if (server.total_create_akun >= server.batas_create_akun) {
      return res.status(400).json({
        success: false,
        message: "Server has reached account creation limit"
      });
    }

    // Check if username already exists on this server
    const existingAccount = await dbUtils.get(
      "SELECT id FROM vpn_accounts WHERE username = ? AND server_id = ? AND status = 'active'",
      [username, serverId]
    );

    if (existingAccount) {
      return res.status(400).json({
        success: false,
        message: "Username already exists on this server"
      });
    }

    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + parseInt(duration));

    // Generate UUID for V2Ray protocols
    let uuid = null;
    if (['vmess', 'vless', 'trojan'].includes(protocol)) {
      uuid = uuidv4();
    }

    // Create VPN account
    const accountResult = await dbUtils.run(`
      INSERT INTO vpn_accounts (
        user_id, server_id, username, password, uuid, protocol, domain,
        expired_at, quota_gb, ip_limit, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, serverId, username, password || null, uuid, protocol, server.domain,
      expirationDate.toISOString(), quota || null, ipLimit || 1, 'active'
    ]);

    // Update server stats
    await dbUtils.run(`
      UPDATE servers SET 
        users = users + 1, 
        total_create_akun = total_create_akun + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [serverId]);

    // Create account on actual VPN server
    try {
      const vpnResponse = await createAccountOnVPNServer({
        username,
        password: password || "123",
        protocol,
        duration,
        quota: quota || 0,
        ipLimit,
        server
      });

      if (vpnResponse.success) {
        // Get the created account details
        const newAccount = await dbUtils.get(
          "SELECT * FROM vpn_accounts WHERE id = ?",
          [accountResult.id]
        );

        logger.logVPN('account_created', userId, serverId, {
          username,
          protocol,
          duration,
          server_response: vpnResponse.data
        });

        res.status(201).json({
          success: true,
          message: vpnResponse.message || "VPN account created successfully",
          account: {
            ...newAccount,
            connection_details: vpnResponse.data
          }
        });
      } else {
        // Rollback database changes if VPN server creation failed
        await dbUtils.run("DELETE FROM vpn_accounts WHERE id = ?", [accountResult.id]);
        await dbUtils.run(`
          UPDATE servers SET 
            users = users - 1, 
            total_create_akun = total_create_akun - 1
          WHERE id = ?
        `, [serverId]);

        res.status(400).json({
          success: false,
          message: vpnResponse.message || "Failed to create account on VPN server"
        });
      }
    } catch (error) {
      // Rollback database changes if API call failed
      await dbUtils.run("DELETE FROM vpn_accounts WHERE id = ?", [accountResult.id]);
      await dbUtils.run(`
        UPDATE servers SET 
          users = users - 1, 
          total_create_akun = total_create_akun - 1
        WHERE id = ?
      `, [serverId]);

      logger.logVPN('account_creation_failed', userId, serverId, {
        username,
        protocol,
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: "Failed to create account on VPN server"
      });
    }
  } catch (error) {
    console.error("Create VPN account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create VPN account"
    });
  }
});

// Get user's VPN accounts (protected route)
router.get("/accounts", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const accounts = await dbUtils.all(`
      SELECT 
        va.*,
        s.name as server_name,
        s.location as server_location,
        s.status as server_status
      FROM vpn_accounts va
      JOIN servers s ON va.server_id = s.id
      WHERE va.user_id = ?
      ORDER BY va.created_at DESC
    `, [userId]);

    // Add connection details for each account
    const accountsWithDetails = accounts.map(account => ({
      ...account,
      connection_details: generateConnectionDetails(account),
      days_remaining: Math.ceil((new Date(account.expired_at) - new Date()) / (1000 * 60 * 60 * 24)),
      is_expired: new Date(account.expired_at) < new Date()
    }));

    res.json({
      success: true,
      accounts: accountsWithDetails
    });
  } catch (error) {
    console.error("Get VPN accounts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch VPN accounts"
    });
  }
});

// Get specific VPN account details (protected route)
router.get("/accounts/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await dbUtils.get(`
      SELECT 
        va.*,
        s.name as server_name,
        s.location as server_location,
        s.status as server_status
      FROM vpn_accounts va
      JOIN servers s ON va.server_id = s.id
      WHERE va.id = ? AND va.user_id = ?
    `, [id, userId]);

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "VPN account not found"
      });
    }

    const accountWithDetails = {
      ...account,
      connection_details: generateConnectionDetails(account),
      days_remaining: Math.ceil((new Date(account.expired_at) - new Date()) / (1000 * 60 * 60 * 24)),
      is_expired: new Date(account.expired_at) < new Date()
    };

    res.json({
      success: true,
      account: accountWithDetails
    });
  } catch (error) {
    console.error("Get VPN account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch VPN account"
    });
  }
});

// Extend VPN account (protected route)
router.put("/accounts/:id/extend", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { days } = req.body;
    const userId = req.user.id;

    if (!days || days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: "Extension days must be between 1 and 365"
      });
    }

    const account = await dbUtils.get(
      "SELECT * FROM vpn_accounts WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "VPN account not found"
      });
    }

    // Calculate new expiration date
    const currentExpiration = new Date(account.expired_at);
    const newExpiration = new Date(currentExpiration.getTime() + (days * 24 * 60 * 60 * 1000));

    // Update account expiration
    await dbUtils.run(
      "UPDATE vpn_accounts SET expired_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newExpiration.toISOString(), id]
    );

    res.json({
      success: true,
      message: "VPN account extended successfully",
      new_expiration: newExpiration.toISOString()
    });
  } catch (error) {
    console.error("Extend VPN account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to extend VPN account"
    });
  }
});

// Delete VPN account (protected route)
router.delete("/accounts/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const account = await dbUtils.get(
      "SELECT * FROM vpn_accounts WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "VPN account not found"
      });
    }

    // Update account status to inactive
    await dbUtils.run(
      "UPDATE vpn_accounts SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    // Update server user count
    await dbUtils.run(
      "UPDATE servers SET users = users - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [account.server_id]
    );

    res.json({
      success: true,
      message: "VPN account deleted successfully"
    });
  } catch (error) {
    console.error("Delete VPN account error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete VPN account"
    });
  }
});

// Function to create account on actual VPN server
async function createAccountOnVPNServer({ username, password, protocol, duration, quota, ipLimit, server }) {
  try {
    // Build the API endpoint according to the working format
    const endpoint = `http://${server.domain}:5888/create${protocol}?user=${username}` +
      (protocol === "ssh" ? `&password=${password}` : "") +
      `&exp=${duration}&quota=${quota}&iplimit=${ipLimit}&auth=${server.auth}`;

    logger.logVPN('api_call_start', null, server.id, {
      endpoint,
      username,
      protocol,
      duration
    });

    // Make the API call to VPN server
    const response = await axios.get(endpoint, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'KedaiVPN-Backend/1.0.0'
      }
    });

    const data = response.data;

    logger.logVPN('api_call_response', null, server.id, {
      status: data.status,
      message: data.message,
      hasData: !!data.data
    });

    if (data.status === "success") {
      return {
        success: true,
        message: data.message,
        data: data.data
      };
    } else {
      return {
        success: false,
        message: data.message || "Failed to create account on VPN server"
      };
    }
  } catch (error) {
    logger.logVPN('api_call_error', null, server.id, {
      error: error.message,
      code: error.code,
      response: error.response?.data
    });

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        success: false,
        message: "VPN server is not reachable"
      };
    } else if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        message: "VPN server request timeout"
      };
    } else {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to communicate with VPN server"
      };
    }
  }
}

// Helper function to generate connection details
function generateConnectionDetails(account) {
  const baseConfig = {
    server: account.domain,
    username: account.username,
    protocol: account.protocol,
    expired_at: account.expired_at
  };

  switch (account.protocol) {
    case 'ssh':
      return {
        ...baseConfig,
        connection_string: `ssh ${account.username}@${account.domain}`,
        port: 22,
        password: account.password
      };
    
    case 'vmess':
      const vmessConfig = {
        v: "2",
        ps: `${account.username}-vmess`,
        add: account.domain,
        port: "443",
        id: account.uuid,
        aid: "0",
        scy: "auto",
        net: "ws",
        type: "none",
        host: account.domain,
        path: "/vmess",
        tls: "tls"
      };
      return {
        ...baseConfig,
        config: vmessConfig,
        connection_string: `vmess://${Buffer.from(JSON.stringify(vmessConfig)).toString('base64')}`
      };
    
    case 'vless':
      return {
        ...baseConfig,
        connection_string: `vless://${account.uuid}@${account.domain}:443?encryption=none&security=tls&sni=${account.domain}&type=ws&path=/vless#${account.username}-vless`
      };
    
    case 'trojan':
      return {
        ...baseConfig,
        connection_string: `trojan://${account.uuid}@${account.domain}:443?sni=${account.domain}&type=ws&path=/trojan#${account.username}-trojan`
      };
    
    default:
      return baseConfig;
  }
}

module.exports = router;