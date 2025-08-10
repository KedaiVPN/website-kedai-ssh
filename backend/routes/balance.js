
const express = require('express');
const router = express.Router();
const BalanceService = require('../services/balanceService');
const { authenticateToken } = require('../middleware/auth');

// Get user balance
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await BalanceService.getUserBalance(userId);
    
    res.json({
      success: true,
      balance: balance,
      message: 'Balance retrieved successfully'
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance'
    });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const transactions = await BalanceService.getTransactionHistory(userId, limit);
    
    res.json({
      success: true,
      data: transactions,
      message: 'Transaction history retrieved successfully'
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history'
    });
  }
});

// Calculate account cost (helper endpoint)
router.post('/calculate-cost', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ipLimit, duration, serverId } = req.body;
    
    if (!ipLimit || !duration) {
      return res.status(400).json({
        success: false,
        message: 'IP limit and duration are required'
      });
    }

    const userRole = await BalanceService.getUserRole(userId);
    const dailyPrice = await BalanceService.getDailyPrice(ipLimit, userRole, serverId || null);
    const totalCost = await BalanceService.calculateServerAccountCost(ipLimit, duration, userRole, serverId || null);
    
    res.json({
      success: true,
      data: {
        ipLimit,
        duration,
        dailyPrice,
        totalCost,
        breakdown: `Rp${dailyPrice.toLocaleString('id-ID')} × ${duration} hari = Rp${totalCost.toLocaleString('id-ID')}`,
        userRole,
        serverId: serverId || null
      }
    });
  } catch (error) {
    console.error('Calculate cost error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
