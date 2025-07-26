const express = require("express");
const router = express.Router();

// Placeholder for admin routes - will be implemented in Phase 4
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Admin routes placeholder - Phase 4 implementation pending",
    endpoints: [
      "POST /login - Admin login",
      "GET /servers - Get all servers",
      "POST /servers - Add new server",
      "PUT /servers/:id - Update server",
      "DELETE /servers/:id - Delete server",
      "GET /users - Get all users",
      "GET /accounts - Get all VPN accounts"
    ]
  });
});

module.exports = router;