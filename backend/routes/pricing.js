const express = require("express");
const router = express.Router();
const BalanceService = require('../services/balanceService');
const { authenticateToken } = require('../middleware/auth');

// GET /api/pricing - Fetches the global pricing configuration
// Note: Temporarily removed authentication for debugging purposes.
router.get("/", async (req, res) => {
  try {
    const pricingConfig = await BalanceService.getGlobalPricingConfig();
    res.json({
      success: true,
      data: pricingConfig,
    });
  } catch (error) {
    console.error('[API /pricing] Error fetching pricing config:', error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil konfigurasi harga.",
    });
  }
});

module.exports = router;
