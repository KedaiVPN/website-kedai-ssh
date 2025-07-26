const express = require("express");
const router = express.Router();

// Placeholder for VPN routes - will be implemented in Phase 3
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VPN routes placeholder - Phase 3 implementation pending",
    endpoints: [
      "GET /servers - Get available servers",
      "POST /create-account - Create VPN account",
      "GET /accounts - Get user VPN accounts",
      "DELETE /accounts/:id - Delete VPN account"
    ]
  });
});

module.exports = router;