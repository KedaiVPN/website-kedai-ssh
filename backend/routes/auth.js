const express = require("express");
const router = express.Router();

// Placeholder for auth routes - will be implemented in Phase 2
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Auth routes placeholder - Phase 2 implementation pending",
    endpoints: [
      "POST /register - User registration",
      "POST /login - User login", 
      "GET /google - Google OAuth login",
      "GET /google/callback - Google OAuth callback",
      "POST /google/set-username - Set username for Google users"
    ]
  });
});

module.exports = router;