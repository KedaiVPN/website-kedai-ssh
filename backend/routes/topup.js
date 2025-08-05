
const express = require('express');
const router = express.Router();
const TopupService = require('../services/topupService');
const BalanceService = require('../services/balanceService');
const { authenticateToken } = require('../middleware/auth');

// Create payment
router.post('/create-payment', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate amount
    if (!amount || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum topup amount is Rp10,000'
      });
    }

    if (amount > 10000000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum topup amount is Rp10,000,000'
      });
    }

    const paymentResult = await TopupService.createPayment(userId, amount, paymentMethod);

    res.json({
      success: true,
      data: paymentResult,
      message: 'Payment created successfully'
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment'
    });
  }
});

// Duitku callback handler
router.post('/callback', async (req, res) => {
  try {
    const {
      merchantCode,
      amount,
      merchantOrderId,
      productDetail,
      additionalParam,
      paymentCode,
      resultCode,
      merchantUserId,
      reference,
      signature,
      publisherOrderId,
      spUserHash,
      settlementDate,
      issuerCode
    } = req.body;

    console.log('Duitku callback received:', req.body);

    // Validate signature
    const isValidSignature = TopupService.validateCallbackSignature(
      merchantCode,
      amount,
      merchantOrderId,
      process.env.DUITKU_API_KEY,
      signature
    );

    if (!isValidSignature) {
      console.error('Invalid signature from Duitku callback');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Get transaction from database
    const transaction = await TopupService.getTransactionByReference(reference);
    if (!transaction) {
      console.error('Transaction not found:', reference);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Process based on result code
    let status = 'pending';
    if (resultCode === '00') {
      status = 'success';
      
      // Add balance to user account
      try {
        await BalanceService.addBalance(
          transaction.user_id,
          parseInt(amount),
          `Topup via ${paymentCode || 'Duitku'}`,
          'topup',
          transaction.id
        );
        
        console.log(`Balance added successfully for user ${transaction.user_id}: ${amount}`);
      } catch (balanceError) {
        console.error('Failed to add balance:', balanceError);
        status = 'failed';
      }
    } else if (resultCode === '01') {
      status = 'pending';
    } else {
      status = 'failed';
    }

    // Update transaction status
    await TopupService.updateTransactionStatus(reference, status, paymentCode);

    res.json({
      success: true,
      message: 'Callback processed successfully'
    });

  } catch (error) {
    console.error('Callback processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process callback'
    });
  }
});

// Get topup history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const history = await TopupService.getUserTopupHistory(userId, limit);

    res.json({
      success: true,
      data: history,
      message: 'Topup history retrieved successfully'
    });

  } catch (error) {
    console.error('Get topup history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve topup history'
    });
  }
});

// Check transaction status
router.get('/status/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;
    const transaction = await TopupService.getTransactionByReference(reference);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify user owns this transaction
    if (transaction.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        reference: transaction.duitku_reference,
        status: transaction.status,
        amount: transaction.amount,
        paymentMethod: transaction.payment_method,
        createdAt: transaction.created_at
      },
      message: 'Transaction status retrieved successfully'
    });

  } catch (error) {
    console.error('Get transaction status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction status'
    });
  }
});

module.exports = router;
