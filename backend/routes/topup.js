const express = require('express');
const router = express.Router();
const TopupService = require('../services/topupService');
const BalanceService = require('../services/balanceService');
const TelegramService = require('../services/telegramService');
const MidtransService = require('../services/midtransService');
const SystemSettingsService = require('../services/systemSettingsService');
const { authenticateToken } = require('../middleware/auth');

// Get active payment gateway config
router.get('/config', authenticateToken, async (req, res) => {
  try {
    const gateway = await SystemSettingsService.getActivePaymentGateway();
    let config = { gateway };
    if (gateway === 'MIDTRANS') {
       const midtransConfig = MidtransService.getConfig();
       config.clientKey = midtransConfig.clientKey;
       config.isProduction = midtransConfig.isProduction;
    }
    res.json({ success: true, ...config });
  } catch (err) {
    console.error('Error fetching payment config:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch config' });
  }
});

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
    const { amount, paymentMethod, phoneNumber } = req.body;
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

    // Check active gateway
    const activeGateway = await SystemSettingsService.getActivePaymentGateway();

    if (activeGateway === 'MIDTRANS') {
        // MIDTRANS FLOW
        const orderId = `TOPUP_${userId}_${Date.now()}`;
        const transactionParams = {
            orderId,
            amount,
            customerName: userEmail.split('@')[0],
            customerEmail: userEmail,
            customerPhone: phoneNumber,
            itemDetails: [{
                id: 'TOPUP-SALDO',
                price: amount,
                quantity: 1,
                name: 'Topup Saldo KedaiVPN'
            }]
        };

        const snapResponse = await MidtransService.createSnapTransaction(transactionParams);

        // Save transaction to DB
        // We use orderId as both reference and merchant_ref for simplicity in Midtrans case
        // Payment method is 'MIDTRANS_SNAP' initially
        await TopupService.saveTransaction({
            userId,
            amount,
            amountGross: amount, // Snap might have fees but we don't know yet, usually exact amount
            reference: orderId, // Use orderId as reference
            merchantRef: orderId,
            paymentMethod: 'MIDTRANS_SNAP',
            status: 'pending',
            paymentUrl: snapResponse.redirect_url,
            qrCodeUrl: null
        });

        return res.json({
            success: true,
            flow: 'SNAP',
            token: snapResponse.token,
            redirect_url: snapResponse.redirect_url,
            reference: orderId,
            message: 'Midtrans Snap token created'
        });
    }

    // TRIPAY FLOW (Existing)
    // Validate user email
    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: 'User email is required'
      });
    }

    // Validate phone number for DANA and OVO
    if ((paymentMethod === 'DANA' || paymentMethod === 'OVO') && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for DANA and OVO payments'
      });
    }

    console.log('Creating Tripay payment for user:', { userId, userEmail, amount, paymentMethod, phoneNumber });

    const paymentResult = await TopupService.createPayment(userId, amount, userEmail, paymentMethod || 'QRIS', phoneNumber);

    // Spread the paymentResult to flatten the response structure
    res.json({
      success: true,
      ...paymentResult,
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

// Midtrans callback handler
router.post('/midtrans-callback', async (req, res) => {
    try {
        const notificationJson = req.body;
        const statusResponse = await MidtransService.handleNotification(notificationJson);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;
        const grossAmount = statusResponse.gross_amount;
        const paymentType = statusResponse.payment_type;

        console.log(`Midtrans notification received for Order ID: ${orderId}, Status: ${transactionStatus}`);

        // Get transaction from DB
        const transaction = await TopupService.getTransactionByReference(orderId);
        if (!transaction) {
             console.error('Transaction not found:', orderId);
             return res.status(404).json({ success: false, message: 'Transaction not found' });
        }

        // If already success, ignore
        if (transaction.status === 'success') {
            return res.json({ success: true, message: 'Transaction already processed' });
        }

        const internalStatus = MidtransService.mapStatusToInternal(transactionStatus, fraudStatus);

        if (internalStatus === 'success') {
             try {
                // Add balance
                const balanceResult = await BalanceService.addBalance(
                    transaction.user_id,
                    transaction.amount,
                    `Topup via Midtrans (${paymentType})`,
                    'topup',
                    transaction.id
                );

                // Telegram Notification
                try {
                    const userData = await TopupService.getUserData(transaction.user_id);
                    const telegramService = new TelegramService();
                    await telegramService.notifyTopup({
                        username: userData?.username || 'User',
                        userId: transaction.user_id,
                        amount: transaction.amount,
                        transactionCode: orderId
                    });
                } catch (e) {
                    console.error('Telegram notify error:', e);
                }

                // Handle Role Upgrade (Copy-paste logic from Tripay handler)
                if (balanceResult.roleUpdated && balanceResult.newRole === 'reseller') {
                    // Send Telegram notification for reseller upgrade
                    try {
                      const userData = await TopupService.getUserData(transaction.user_id);
                      const telegramService = new TelegramService();

                      await telegramService.notifyResellerUpgrade({
                        username: userData?.username || 'User',
                        userId: transaction.user_id,
                        newRole: 'reseller'
                      });
                    } catch (telegramError) {
                      console.error('[TelegramService] Failed to send reseller upgrade notification:', telegramError.message);
                    }

                    // Store new token
                    if (balanceResult.newToken) {
                      req.app.locals.roleUpgradeTokens = req.app.locals.roleUpgradeTokens || {};
                      req.app.locals.roleUpgradeTokens[orderId] = {
                        newToken: balanceResult.newToken,
                        userId: transaction.user_id,
                        timestamp: Date.now()
                      };
                       req.app.locals.roleUpgradeTokens[`user_${transaction.user_id}`] = {
                        newToken: balanceResult.newToken,
                        userId: transaction.user_id,
                        timestamp: Date.now()
                      };
                    }
                }

             } catch (balanceError) {
                console.error('Failed to add balance (Midtrans):', balanceError);
                // Don't update status to failed if balance adding failed, maybe retry?
                // But for now, let's keep it pending or mark failed?
                // Usually we should log critical error.
                return res.status(500).json({ success: false, message: 'Failed to process balance' });
             }
        }

        await TopupService.updateTransactionStatus(orderId, internalStatus, paymentType);

        res.json({ success: true, message: 'OK' });
    } catch (error) {
        console.error('Midtrans callback error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
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
        
        // Add balance to user account and handle role upgrade - FIX: Use transaction.amount instead of total_amount
        try {
          const balanceResult = await BalanceService.addBalance(
            transaction.user_id,
            transaction.amount, // FIXED: Use original amount, not total_amount with fees
            `Topup via ${payment_method || 'Tripay'}`,
            'topup',
            transaction.id
          );
          
          console.log(`Balance added successfully for user ${transaction.user_id}: ${transaction.amount} (Fee excluded from balance)`);
          
          // Send Telegram notification for successful topup
          try {
            const userData = await TopupService.getUserData(transaction.user_id);
            const telegramService = new TelegramService();
            
            await telegramService.notifyTopup({
              username: userData?.username || customer_email.split('@')[0],
              userId: transaction.user_id,
              amount: transaction.amount, // Original amount without fees
              transactionCode: reference
            });
            
            console.log('[TelegramService] Topup notification sent');
          } catch (telegramError) {
            console.error('[TelegramService] Failed to send topup notification:', telegramError.message);
          }
          
          // Check if user role was upgraded to reseller
          if (balanceResult.roleUpdated && balanceResult.newRole === 'reseller') {
            console.log(`User ${transaction.user_id} upgraded to RESELLER role due to topup >= Rp150,000`);
            
            // Send Telegram notification for reseller upgrade
            try {
              const userData = await TopupService.getUserData(transaction.user_id);
              const telegramService = new TelegramService();
              
              await telegramService.notifyResellerUpgrade({
                username: userData?.username || customer_email.split('@')[0],
                userId: transaction.user_id,
                newRole: 'reseller'
              });
              
              console.log('[TelegramService] Reseller upgrade notification sent');
            } catch (telegramError) {
              console.error('[TelegramService] Failed to send reseller upgrade notification:', telegramError.message);
            }
            
            // Store new token for immediate return (unified with admin approach)
            if (balanceResult.newToken) {
              console.log(`New token generated for user ${transaction.user_id} role upgrade`);
              // Store the new token in memory for immediate access
              req.app.locals.roleUpgradeTokens = req.app.locals.roleUpgradeTokens || {};
              req.app.locals.roleUpgradeTokens[reference] = {
                newToken: balanceResult.newToken,
                userId: transaction.user_id,
                timestamp: Date.now()
              };
              
              // Also store by user ID for easy lookup
              req.app.locals.roleUpgradeTokens[`user_${transaction.user_id}`] = {
                newToken: balanceResult.newToken,
                userId: transaction.user_id,
                timestamp: Date.now()
              };
            }
          }
          
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

    let statusData = {
        reference: transaction.duitku_reference,
        status: transaction.status,
        amountNet: transaction.amount,
        amountGross: transaction.amount_gross,
        paymentMethod: transaction.payment_method,
        createdAt: transaction.created_at,
        newToken: null
    };

    // Also check status from API for real-time updates
    // If Midtrans (check payment_method or active config + flow)
    // We can infer it's Midtrans if payment_method starts with 'MIDTRANS' or if it was just created (status pending).
    // Or if active gateway is Midtrans (but old Tripay trans still exist).
    // Tripay check needs API key. Midtrans needs Server key.

    // Better logic: try to detect provider from transaction data.
    // TopupService.createPayment saves payment_method='QRIS', etc.
    // Midtrans create saves payment_method='MIDTRANS_SNAP'.

    // BUT: Tripay logic in TopupService.checkPaymentStatus checks Tripay API.
    // I should only call Tripay API if it's a Tripay transaction.

    const isMidtrans = transaction.payment_method === 'MIDTRANS_SNAP' || (transaction.payment_method && transaction.payment_method !== 'QRIS' && !['BRIVA','BNIVA','MANDIRIVA','OVO','DANA'].includes(transaction.payment_method) && transaction.duitku_reference.startsWith('TOPUP_'));
    // Actually Tripay also uses 'TOPUP_' in merchant_ref, but duitku_reference (Tripay Ref) starts with T.
    // Midtrans Snap logic uses TOPUP_... as reference.

    const isTripayRef = transaction.duitku_reference.startsWith('T') && transaction.duitku_reference.length < 20; // Heuristic

    if (isTripayRef) {
        // Use the actual Tripay reference stored in DB, not potentially the merchant ref passed as param
        const tripayStatus = await TopupService.checkPaymentStatus(transaction.duitku_reference);
        statusData.tripayStatus = tripayStatus;
    }
    // If it looks like our generated ID (Midtrans)
    else if (transaction.payment_method === 'MIDTRANS_SNAP') {
         // Should we check Midtrans API? Not strictly required if we rely on callback, but good for polling.
         // Client side polling might want latest status.
         // Calling notification endpoint requires JSON payload.
         // Calling status endpoint (core api) requires order_id.
         try {
             const apiClient = MidtransService.getCoreApiClient();
             // reference here is the orderId for Midtrans
             const statusResponse = await apiClient.transaction.status(reference);
             statusData.midtransStatus = statusResponse.transaction_status;

             // Update DB if changed? Maybe better handled by callback, but doing it here ensures client sees update.
             // But let's avoid side effects in GET unless necessary.
         } catch(e) {
             console.error('Midtrans status check failed:', e.message);
         }
    }
    
    // Check if there's a new token for this transaction (role upgrade) - UNIFIED APPROACH
    let newToken = null;
    if (req.app.locals.roleUpgradeTokens) {
      // Check by reference first
      if (req.app.locals.roleUpgradeTokens[reference]) {
        const tokenData = req.app.locals.roleUpgradeTokens[reference];
        if (tokenData.userId === req.user.id) {
          newToken = tokenData.newToken;
          // Clean up both reference and user_id keys
          delete req.app.locals.roleUpgradeTokens[reference];
          delete req.app.locals.roleUpgradeTokens[`user_${req.user.id}`];
        }
      }
      // Also check by user ID (fallback)
      else if (req.app.locals.roleUpgradeTokens[`user_${req.user.id}`]) {
        const tokenData = req.app.locals.roleUpgradeTokens[`user_${req.user.id}`];
        newToken = tokenData.newToken;
        // Clean up both keys
        delete req.app.locals.roleUpgradeTokens[`user_${req.user.id}`];
        delete req.app.locals.roleUpgradeTokens[reference];
      }
    }
    statusData.newToken = newToken;

    res.json({
      success: true,
      data: statusData,
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
