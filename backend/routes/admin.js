const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { dbUtils } = require("../config/database");
const { verifyToken, verifyAdmin } = require("../middleware/auth");
const { validateServer, validatePasswordChange, handleValidationErrors } = require("../middleware/validation");
const logger = require("../utils/logger");

const router = express.Router();

// Admin login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    // Get admin user
    const admin = await dbUtils.get(
      "SELECT * FROM users WHERE (username = ? OR email = ?) AND role = 'admin'",
      [username, username]
    );

    if (!admin) {
      logger.warn(`Failed admin login attempt for username: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      logger.warn(`Failed admin login attempt for username: ${username}`);
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin.id, 
        username: admin.username, 
        role: admin.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
    );

    logger.info(`Admin login successful for: ${admin.username}`);

    res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    logger.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

// Change admin password
router.post("/change-password", verifyToken, verifyAdmin, validatePasswordChange, handleValidationErrors, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;

    // Get current admin
    const admin = await dbUtils.get("SELECT * FROM users WHERE id = ?", [adminId]);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isCurrentValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await dbUtils.run(
      "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [newPasswordHash, adminId]
    );

    logger.info(`Password changed for admin: ${admin.username}`);

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    logger.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
});

// Get all servers
router.get("/servers", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const servers = await dbUtils.all("SELECT * FROM servers ORDER BY created_at DESC");
    
    res.json({
      success: true,
      servers
    });
  } catch (error) {
    logger.error("Get servers error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch servers"
    });
  }
});

// Add new server
router.post("/servers", verifyToken, verifyAdmin, validateServer, handleValidationErrors, async (req, res) => {
  try {
    const { name, domain, location, auth, protocols, max_users, max_account_creation } = req.body;

    const result = await dbUtils.run(
      `INSERT INTO servers (name, domain, location, auth, protocols, max_users, max_account_creation, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [name, domain, location, JSON.stringify(auth), JSON.stringify(protocols), max_users || null, max_account_creation || null]
    );

    const newServer = await dbUtils.get("SELECT * FROM servers WHERE id = ?", [result.lastID]);

    logger.info(`New server added: ${name} by admin ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: "Server added successfully",
      server: newServer
    });
  } catch (error) {
    logger.error("Add server error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add server"
    });
  }
});

// Update server
router.put("/servers/:id", verifyToken, verifyAdmin, validateServer, handleValidationErrors, async (req, res) => {
  try {
    const serverId = req.params.id;
    const { name, domain, location, auth, protocols, max_users, max_account_creation, status } = req.body;

    // Check if server exists
    const existingServer = await dbUtils.get("SELECT * FROM servers WHERE id = ?", [serverId]);
    if (!existingServer) {
      return res.status(404).json({
        success: false,
        message: "Server not found"
      });
    }

    await dbUtils.run(
      `UPDATE servers SET name = ?, domain = ?, location = ?, auth = ?, protocols = ?, 
       max_users = ?, max_account_creation = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, domain, location, JSON.stringify(auth), JSON.stringify(protocols), 
       max_users || null, max_account_creation || null, status || 'active', serverId]
    );

    const updatedServer = await dbUtils.get("SELECT * FROM servers WHERE id = ?", [serverId]);

    logger.info(`Server updated: ${name} by admin ${req.user.username}`);

    res.json({
      success: true,
      message: "Server updated successfully",
      server: updatedServer
    });
  } catch (error) {
    logger.error("Update server error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update server"
    });
  }
});

// Delete server
router.delete("/servers/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const serverId = req.params.id;

    // Check if server exists
    const existingServer = await dbUtils.get("SELECT * FROM servers WHERE id = ?", [serverId]);
    if (!existingServer) {
      return res.status(404).json({
        success: false,
        message: "Server not found"
      });
    }

    // Check if server has active VPN accounts
    const activeAccounts = await dbUtils.get(
      "SELECT COUNT(*) as count FROM vpn_accounts WHERE server_id = ? AND status = 'active'",
      [serverId]
    );

    if (activeAccounts.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete server. It has ${activeAccounts.count} active VPN accounts.`
      });
    }

    await dbUtils.run("DELETE FROM servers WHERE id = ?", [serverId]);

    logger.info(`Server deleted: ${existingServer.name} by admin ${req.user.username}`);

    res.json({
      success: true,
      message: "Server deleted successfully"
    });
  } catch (error) {
    logger.error("Delete server error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete server"
    });
  }
});

// Get all users
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT u.id, u.username, u.email, u.role, u.is_active, u.auth_provider, 
             u.created_at, u.updated_at,
             COUNT(va.id) as vpn_accounts_count
      FROM users u
      LEFT JOIN vpn_accounts va ON u.id = va.user_id
    `;
    let params = [];

    if (search) {
      query += ` WHERE u.username LIKE ? OR u.email LIKE ?`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const users = await dbUtils.all(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM users";
    let countParams = [];
    
    if (search) {
      countQuery += " WHERE username LIKE ? OR email LIKE ?";
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const totalResult = await dbUtils.get(countQuery, countParams);

    res.json({
      success: true,
      users,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: totalResult.total,
        total_pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    logger.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    });
  }
});

// Get all VPN accounts
router.get("/accounts", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, protocol, server_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT va.*, u.username, u.email, s.name as server_name, s.domain as server_domain
      FROM vpn_accounts va
      JOIN users u ON va.user_id = u.id
      JOIN servers s ON va.server_id = s.id
      WHERE 1=1
    `;
    let params = [];

    if (status) {
      query += ` AND va.status = ?`;
      params.push(status);
    }

    if (protocol) {
      query += ` AND va.protocol = ?`;
      params.push(protocol);
    }

    if (server_id) {
      query += ` AND va.server_id = ?`;
      params.push(server_id);
    }

    query += ` ORDER BY va.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const accounts = await dbUtils.all(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM vpn_accounts va 
      WHERE 1=1
    `;
    let countParams = [];

    if (status) {
      countQuery += ` AND va.status = ?`;
      countParams.push(status);
    }

    if (protocol) {
      countQuery += ` AND va.protocol = ?`;
      countParams.push(protocol);
    }

    if (server_id) {
      countQuery += ` AND va.server_id = ?`;
      countParams.push(server_id);
    }

    const totalResult = await dbUtils.get(countQuery, countParams);

    res.json({
      success: true,
      accounts,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: totalResult.total,
        total_pages: Math.ceil(totalResult.total / limit)
      }
    });
  } catch (error) {
    logger.error("Get VPN accounts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch VPN accounts"
    });
  }
});

// Get dashboard statistics
router.get("/stats", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const stats = {};

    // Total users
    const usersResult = await dbUtils.get("SELECT COUNT(*) as total FROM users WHERE role != 'admin'");
    stats.total_users = usersResult.total;

    // Active users (users with active VPN accounts)
    const activeUsersResult = await dbUtils.get(`
      SELECT COUNT(DISTINCT user_id) as total 
      FROM vpn_accounts 
      WHERE status = 'active' AND expires_at > datetime('now')
    `);
    stats.active_users = activeUsersResult.total;

    // Total servers
    const serversResult = await dbUtils.get("SELECT COUNT(*) as total FROM servers WHERE status = 'active'");
    stats.total_servers = serversResult.total;

    // Total VPN accounts
    const accountsResult = await dbUtils.get("SELECT COUNT(*) as total FROM vpn_accounts");
    stats.total_accounts = accountsResult.total;

    // Active VPN accounts
    const activeAccountsResult = await dbUtils.get(`
      SELECT COUNT(*) as total 
      FROM vpn_accounts 
      WHERE status = 'active' AND expires_at > datetime('now')
    `);
    stats.active_accounts = activeAccountsResult.total;

    // Accounts by protocol
    const protocolStats = await dbUtils.all(`
      SELECT protocol, COUNT(*) as count 
      FROM vpn_accounts 
      WHERE status = 'active' 
      GROUP BY protocol
    `);
    stats.accounts_by_protocol = protocolStats;

    // Recent registrations (last 30 days)
    const recentUsersResult = await dbUtils.get(`
      SELECT COUNT(*) as total 
      FROM users 
      WHERE created_at > datetime('now', '-30 days') AND role != 'admin'
    `);
    stats.recent_users = recentUsersResult.total;

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error("Get stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics"
    });
  }
});

module.exports = router;