const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const xlService = require('../services/xlService');
const pool = require('../db/connection');

// Helper untuk normalisasi nomor
const normalizePhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('08')) {
    return '62' + cleaned.substring(1);
  }
  return cleaned.startsWith('62') ? cleaned : '62' + cleaned;
};

// In-memory store untuk binding OTP session
// Format: userId:authId -> { phone, timestamp, method }
const xlOtpSessions = new Map();
const OTP_SESSION_TTL = 5 * 60 * 1000; // 5 menit

// Cleanup expired sessions setiap menit
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of xlOtpSessions.entries()) {
    if (now - value.timestamp > OTP_SESSION_TTL) {
      xlOtpSessions.delete(key);
      console.log('[XL Session Store] Cleaned expired session:', key);
    }
  }
}, 60000);

// 1. Request OTP
router.post('/request-otp', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = normalizePhone(phone);
    
    if (!/^628\d{8,12}$/.test(normalizedPhone)) {
      return res.json({ 
        success: false, 
        message: 'Nomor HP invalid (format: 628xxxxx)' 
      });
    }
    
    console.log('[XL Route] Request OTP for:', normalizedPhone);
    
    const result = await xlService.requestOTP(normalizedPhone);
    
    console.log('[XL Request OTP] Result:', {
      status: result?.status,
      message: result?.message,
      hasAuthId: !!result?.data?.auth_id
    });
    
    // Simpan session binding
    if (result.status === true && result?.data?.auth_id) {
      const sessionKey = `${req.user.id}:${result.data.auth_id}`;
      xlOtpSessions.set(sessionKey, {
        phone: normalizedPhone,
        timestamp: Date.now(),
        method: 'OTP',
        userId: req.user.id
      });
      console.log('[XL Session Store] Saved OTP session:', {
        key: sessionKey.substring(0, 30) + '...',
        phone: normalizedPhone,
        totalSessions: xlOtpSessions.size
      });
    }
    
    res.json({ 
      success: result.status === true, 
      message: result.message,
      data: { auth_id: result?.data?.auth_id || null }
    });
  } catch (error) {
    console.error('[XL Route] Request OTP error:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 2. Login OTP
router.post('/login-otp', authenticateToken, async (req, res) => {
  try {
    const { phone, authId, otp } = req.body;
    
    if (!authId || !otp) {
      return res.json({ 
        success: false, 
        message: 'Auth ID dan OTP wajib diisi' 
      });
    }
    
    // Lookup session dari store
    const sessionKey = `${req.user.id}:${authId}`;
    const sessionData = xlOtpSessions.get(sessionKey);
    
    let phoneToUse;
    let sessionValid = false;
    
    if (sessionData) {
      const isExpired = (Date.now() - sessionData.timestamp) > OTP_SESSION_TTL;
      if (isExpired) {
        console.log('[XL Session Store] Session expired:', sessionKey.substring(0, 30) + '...');
        xlOtpSessions.delete(sessionKey);
        return res.json({
          success: false,
          message: 'Session OTP telah kedaluarsa. Silakan minta OTP baru.'
        });
      }
      
      phoneToUse = sessionData.phone;
      sessionValid = true;
      console.log('[XL Session Store] Using session phone:', phoneToUse);
    } else {
      // Fallback ke normalized phone dari body
      phoneToUse = normalizePhone(phone);
      console.warn('[XL Session Store] No session found for authId, using phone from body:', phoneToUse);
      console.warn('[XL Session Store] This might cause issues. AuthId:', authId.substring(0, 8) + '...');
    }
    
    console.log('[XL Route] Login OTP attempt:', {
      userId: req.user.id,
      phoneToUse,
      authIdPrefix: authId.substring(0, 8) + '...',
      otpLength: otp.length,
      sessionValid,
      totalActiveSessions: xlOtpSessions.size
    });
    
    const result = await xlService.loginOTP(phoneToUse, authId, otp);
    
    console.log('[XL Login OTP] Result:', {
      status: result?.status,
      message: result?.message,
      hasAccessToken: !!result?.data?.access_token
    });
    
    // Hapus session setelah digunakan (baik sukses maupun gagal)
    if (sessionData) {
      xlOtpSessions.delete(sessionKey);
      console.log('[XL Session Store] Deleted used session');
    }
    
    res.json({ 
      success: result.status === true, 
      message: result.message,
      data: { access_token: result?.data?.access_token || null }
    });
  } catch (error) {
    console.error('[XL Route] Login OTP error:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 3. Get Quota Details
router.post('/quota-details', authenticateToken, async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.json({ 
        success: false, 
        message: 'Access token wajib diisi' 
      });
    }
    
    const result = await xlService.getSubscriberInfo(accessToken);
    
    // The frontend expects the data to be in a nested `data` property
    res.json({ 
      success: true, 
      data: result.data
    });
  } catch (error) {
    console.error('[XL Route] Subscriber Info error:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 4. Get Packages (for user)
router.get('/packages', authenticateToken, async (req, res) => {
  try {
    const [packages] = await pool.query(
      'SELECT id, package_code, name, description, price, fee FROM xl_packages WHERE is_active = 1 ORDER BY price ASC'
    );
    
    res.json({ 
      success: true, 
      data: packages 
    });
  } catch (error) {
    console.error('[XL Route] Get Packages error:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// 5. Purchase Package
router.post('/purchase', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { packageCode, phone, accessToken, paymentMethod } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!packageCode || typeof packageCode !== 'string' || packageCode.trim() === '') {
      throw new Error('Package code is required');
    }
    if (!phone || typeof phone !== 'string' || phone.trim() === '') {
      throw new Error('Phone number is required');
    }
    if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
      throw new Error('Access token is required');
    }
    
    // Validate payment method
    const validPaymentMethods = ['DANA', 'QRIS', 'GOPAY', 'SHOPEEPAY', 'OVO', 'BALANCE'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      throw new Error('Invalid payment method. Must be one of: ' + validPaymentMethods.join(', '));
    }

    // Get package info from our local database
    const [packageRows] = await connection.query(
      'SELECT * FROM xl_packages WHERE package_code = ? AND is_active = 1',
      [packageCode]
    );
    
    if (!packageRows[0]) {
      throw new Error('Paket tidak ditemukan');
    }
    
    const packageData = packageRows[0];
    const fee = packageData.fee;
    
    // Check user balance
    const [userRows] = await connection.query(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    
    if (userRows[0].balance < fee) {
      throw new Error('Saldo tidak mencukupi. Fee: Rp' + fee.toLocaleString());
    }
    
    // The price sent to the external API is the one from our database
    const price_or_fee = packageData.price;

    // Purchase to XL API
    console.log('[XL Purchase] Request:', {
      packageCode,
      phone,
      paymentMethod,
      price_or_fee: Number(price_or_fee)
    });
    
    const purchaseResult = await xlService.purchasePackage(
      packageCode, 
      phone, 
      accessToken, 
      paymentMethod,
      Number(price_or_fee)
    );
    
    console.log('[XL Purchase] API Response:', JSON.stringify(purchaseResult, null, 2));
    
    // Check if XL API request was successful
    if (!purchaseResult.status) {
      throw new Error(purchaseResult.message || 'Purchase failed at XL API');
    }
    
    // Deduct balance (CRITICAL: Only deduct after API confirms success)
    await connection.query(
      'UPDATE users SET balance = balance - ? WHERE id = ?',
      [fee, userId]
    );
    
    // Get balance after deduction
    const [balanceAfter] = await connection.query(
      'SELECT balance FROM users WHERE id = ?',
      [userId]
    );
    
    // Record transaction in xl_transactions
    const [txResult] = await connection.query(
      `INSERT INTO xl_transactions 
       (user_id, package_code, package_name, phone, trx_id, payment_method, fee, status, payment_url, qr_code, deeplink_url, payment_expired_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        userId,
        packageCode,
        packageData.name,
        phone,
        purchaseResult.data?.trx_id || null,
        paymentMethod,
        fee,
        purchaseResult.data?.payment_url || null,
        purchaseResult.data?.qris_data?.qr_code || null,
        purchaseResult.data?.deeplink_data?.deeplink_url || null,
        purchaseResult.data?.qris_data?.payment_expired_at || null
      ]
    );
    
    // Record balance transaction
    await connection.query(
      `INSERT INTO balance_transactions 
       (user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after) 
       VALUES (?, 'debit', ?, ?, 'xl_transaction', ?, ?, ?)`,
      [
        userId, 
        fee, 
        `Pembelian paket XL: ${packageData.name}`,
        txResult.insertId,
        userRows[0].balance,
        balanceAfter[0].balance
      ]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      data: {
        // Data from XL API
        msisdn: purchaseResult.data?.msisdn,
        package_code: purchaseResult.data?.package_code,
        package_name: purchaseResult.data?.package_name,
        trx_id: purchaseResult.data?.trx_id,
        have_deeplink: purchaseResult.data?.have_deeplink,
        deeplink_data: purchaseResult.data?.deeplink_data,
        is_qris: purchaseResult.data?.is_qris,
        qris_data: purchaseResult.data?.qris_data,
        
        // Data from local transaction
        transactionId: txResult.insertId,
        fee,
        balanceDeducted: true,
        remainingBalance: balanceAfter[0].balance
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('[XL Route] Purchase error:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  } finally {
    connection.release();
  }
});

// 6. Get User XL Transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const [transactions] = await pool.query(
      'SELECT * FROM xl_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    
    res.json({ 
      success: true, 
      data: transactions 
    });
  } catch (error) {
    console.error('[XL Route] Get Transactions error:', error);
    res.json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Login with MSISDN
router.post('/login-msisdn', authenticateToken, async (req, res) => {
  try {
    const { msisdn } = req.body;

    if (!msisdn || !/^628\d{8,12}$/.test(msisdn)) {
      return res.json({
        success: false,
        message: 'Nomor HP invalid (format: 628xxxxx)'
      });
    }

    const result = await xlService.loginWithMsisdn(msisdn);

    // The service now returns a structured object
    if (result.success) {
      res.json({
        success: true,
        data: result.data // access_token is inside result.data
      });
    } else {
      res.json({
        success: false,
        message: result.message || 'Gagal login dengan nomor HP'
      });
    }
  } catch (error) {
    console.error('[XL Route] Login MSISDN error:', error);
    // The service throws an error with a message property
    res.json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
