
const express = require('express');
const router = express.Router();
const BalanceService = require('../services/balanceService');
const { authenticateToken } = require('../middleware/auth');

// Get user balance and stats
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await BalanceService.getUserStats(userId);
    
    res.json({
      success: true,
      balance: stats.balance || 0,
      totalAccounts: stats.created_vpn || 0,
      message: 'Balance and stats retrieved successfully'
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

// Get public transaction log (all users, excluding trial)
router.get('/public-log', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter = 'this_month', myOnly = 'false' } = req.query;
    
    const options = {
      filter,
      userId: myOnly === 'true' ? userId : null,
      limit: 200
    };

    const transactions = await BalanceService.getPublicTransactionLog(options);
    
    res.json({
      success: true,
      data: transactions,
      message: 'Transaction log retrieved successfully'
    });
  } catch (error) {
    console.error('Get public transaction log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction log'
    });
  }
});

module.exports = router;
