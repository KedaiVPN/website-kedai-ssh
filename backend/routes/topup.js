
const express = require('express');
const router = express.Router();
const TopupService = require('../services/topupService');
const BalanceService = require('../services/balanceService');
const { authenticateToken } = require('../middleware/auth');

// Test Tripay connection endpoint
router.get('/test-connection', authenticateToken, async (req, res) => {
  try {
    // Test with a small amount
    const testResult = await TopupService.createPayment(req.user.id, 10000, req.user.email, 'QRIS');
    
    res.json({
      success: true,
      message: 'Tripay connection test successful',
      data: {
        canConnect: true,
        testReference: testResult.reference
      }
    });
  } catch (error) {
    console.error('Tripay connection test failed:', error);
    res.json({
      success: false,
      message: 'Tripay connection test failed',
      error: error.message
    });
  }
});

// Create payment
router.post('/create-payment', authenticateToken, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

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

    // Validate user email
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    console.log('Creating Tripay payment for user:', { userId, userEmail, amount, paymentMethod });

    const paymentResult = await TopupService.createPayment(userId, amount, userEmail, paymentMethod || 'QRIS');

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

// Tripay callback handler
router.post('/callback', async (req, res) => {
  try {
    const callbackSignature = req.headers['x-callback-signature'];
    const callbackEvent = req.headers['x-callback-event'];
    const rawBody = JSON.stringify(req.body);

    console.log('Tripay callback received:', {
      event: callbackEvent,
      signature: callbackSignature,
      body: req.body
    });

    // Validate callback event
    if (callbackEvent !== 'payment_status') {
      return res.status(400).json({
        success: false,
        message: 'Invalid callback event'
      });
    }

    // Verify signature
    const { privateKey } = TopupService.verifyEnvironmentVariables();
    const isValidSignature = TopupService.verifyCallbackSignature(callbackSignature, rawBody, privateKey);

    if (!isValidSignature) {
      console.error('Invalid signature from Tripay callback');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const {
      reference,
      merchant_ref,
      status,
      total_amount,
      payment_method,
      customer_email
    } = req.body;

    // Get transaction from database
    const transaction = await TopupService.getTransactionByReference(reference);
    if (!transaction) {
      console.error('Transaction not found:', reference);
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Map Tripay status to internal status
    let internalStatus = 'pending';
    switch (status) {
      case 'PAID':
        internalStatus = 'success';
        
        // Add balance to user account
        try {
          await BalanceService.addBalance(
            transaction.user_id,
            parseInt(total_amount),
            `Topup via ${payment_method || 'Tripay'}`,
            'topup',
            transaction.id
          );
          
          console.log(`Balance added successfully for user ${transaction.user_id}: ${total_amount}`);
        } catch (balanceError) {
          console.error('Failed to add balance:', balanceError);
          internalStatus = 'failed';
        }
        break;
      case 'UNPAID':
        internalStatus = 'pending';
        break;
      case 'EXPIRED':
        internalStatus = 'expired';
        break;
      case 'FAILED':
      default:
        internalStatus = 'failed';
        break;
    }

    // Update transaction status
    await TopupService.updateTransactionStatus(reference, internalStatus, payment_method);

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

    // Also check status from Tripay API for real-time updates
    const tripayStatus = await TopupService.checkPaymentStatus(reference);

    res.json({
      success: true,
      data: {
        reference: transaction.duitku_reference, // Still using existing column name for compatibility
        status: transaction.status,
        amount: transaction.amount,
        paymentMethod: transaction.payment_method,
        createdAt: transaction.created_at,
        tripayStatus: tripayStatus
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
