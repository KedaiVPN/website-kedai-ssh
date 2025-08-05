
const express = require("express");
const { authenticateToken } = require('../middleware/auth');
const BalanceService = require('../services/balanceService');
const router = express.Router();

// Get user balance
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await BalanceService.getUserBalance(userId);
    
    res.json({
      success: true,
      data: { balance }
    });
  } catch (error) {
    console.error("Error getting balance:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil data saldo" });
  }
});

// Get transaction history
router.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const transactions = await BalanceService.getTransactionHistory(userId, limit, offset);
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error("Error getting transaction history:", error);
    res.status(500).json({ success: false, message: "Gagal mengambil riwayat transaksi" });
  }
});

// Top-up balance (placeholder for future implementation)
router.post("/topup", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Jumlah top-up tidak valid" });
    }

    // TODO: Implement payment gateway integration here
    // For now, we'll just add the balance (admin manual top-up)
    
    await BalanceService.addBalance(userId, amount, "Top-up saldo manual");
    
    res.json({
      success: true,
      message: "Saldo berhasil ditambahkan",
      data: { amount }
    });
  } catch (error) {
    console.error("Error topping up balance:", error);
    res.status(500).json({ success: false, message: "Gagal menambah saldo" });
  }
});

module.exports = router;
