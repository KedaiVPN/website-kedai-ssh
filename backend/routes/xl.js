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

// Get Active Packages
router.post('/active-packages', authenticateToken, async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Access token wajib diisi'
      });
    }

    const result = await xlService.getActivePackages(accessToken);

    // Kirim kembali response dari service
    res.json(result);

  } catch (error) {
    console.error('[XL Route] Get Active Packages error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// 4. Get Packages (for user)
router.get('/packages', authenticateToken, async (req, res) => {
  try {
    const [packages] = await pool.query(
      'SELECT id, package_code, name, description, price, fee, payment_method, kategori FROM xl_packages WHERE is_active = 1 ORDER BY price ASC'
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
    
    const { packageCode, phone, accessToken, paymentMethod: userPaymentMethod } = req.body;
    const userId = req.user.id;

    // Validate base input
    if (!packageCode || !phone) {
      return res.status(400).json({ success: false, message: 'Package code dan nomor HP wajib diisi.' });
    }
    
    // Get package info from our local database
    const [packageRows] = await connection.query(
      'SELECT * FROM xl_packages WHERE package_code = ? AND is_active = 1',
      [packageCode]
    );
    
    if (!packageRows[0]) {
      return res.status(404).json({ success: false, message: 'Paket tidak ditemukan atau tidak aktif.' });
    }
    
    const packageData = packageRows[0];
    const fee = packageData.fee;
    let paymentMethodForXL;
    let paymentMethodForDB;
    let accessTokenForXL = accessToken;

    // --- LOGIC FOR OFFICIAL VS UNOFFICIAL PACKAGES ---
    if (packageData.kategori === 'resmi') {
      // Official packages use website balance.
      // The external API expects 'BALANCE' for this kind of payment.
      // No accessToken from user is needed.
      paymentMethodForXL = 'BALANCE';
      paymentMethodForDB = 'saldo';
      accessTokenForXL = 'official_purchase'; // Placeholder, not used by service for 'BALANCE' payment
    } else {
      // Unofficial packages require user to be logged in and select an e-wallet.
      if (!accessToken) {
        throw new Error('Access token diperlukan untuk paket tidak resmi.');
      }
      // Allow BALANCE (for pulsa) in unofficial packages
      const validPaymentMethods = ['DANA', 'QRIS', 'GOPAY', 'SHOPEEPAY', 'OVO', 'BALANCE'];
      if (!userPaymentMethod || !validPaymentMethods.includes(userPaymentMethod)) {
        throw new Error('Metode pembayaran tidak valid untuk paket tidak resmi.');
      }
      paymentMethodForXL = userPaymentMethod;
      paymentMethodForDB = userPaymentMethod;
    }

    // Check user balance for the fee
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
      paymentMethod: paymentMethodForXL,
      price_or_fee: Number(price_or_fee)
    });
    
    const purchaseResult = await xlService.purchasePackage(
      packageData, // Pass the whole package object
      phone, 
      accessTokenForXL,
      paymentMethodForXL,
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
        paymentMethodForDB,
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
    
    // Send Telegram notification (fire-and-forget)
    try {
      const TelegramService = require('../services/telegramService');
      const telegramService = new TelegramService();
      telegramService.sendXLPurchaseNotification({
        packageName: packageData.name,
        username: req.user.username,
        role: req.user.role,
        phoneNumber: phone
      });
    } catch (teleError) {
      console.error('[XL Purchase] Failed to send Telegram notification:', teleError.message);
    }

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

// --- Scheduled Purchases ---

// Get scheduled purchases for a user and phone number
router.get('/scheduled-purchases', authenticateToken, async (req, res) => {
    try {
        const { phone_number } = req.query;
        if (!phone_number) {
            return res.status(400).json({ success: false, message: 'Nomor telepon wajib diisi.' });
        }

        const [scheduledPurchases] = await pool.query(
            `SELECT sp.id, sp.phone_number, sp.package_code, sp.scheduled_date, sp.status, xp.name as package_name, xp.fee
             FROM xl_scheduled_purchases sp
             JOIN xl_packages xp ON sp.package_code = xp.package_code
             WHERE sp.user_id = ? AND sp.phone_number = ? AND sp.status = 'active'
             ORDER BY sp.scheduled_date ASC`,
            [req.user.id, phone_number]
        );

        res.json({ success: true, data: scheduledPurchases });
    } catch (error) {
        console.error('[XL Route] Get Scheduled Purchases error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data pembelian terjadwal.' });
    }
});


// Create scheduled purchases
router.post('/scheduled-purchases', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { phone_number, package_code, scheduled_dates } = req.body;
        const userId = req.user.id;

        if (!phone_number || !package_code || !scheduled_dates || !Array.isArray(scheduled_dates) || scheduled_dates.length === 0) {
            return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
        }

        if (scheduled_dates.length > 4) {
            return res.status(400).json({ success: false, message: 'Maksimal 4 jadwal pembelian per transaksi.' });
        }

        // Validate package
        const [packageRows] = await connection.query(
            'SELECT fee FROM xl_packages WHERE package_code = ? AND is_active = 1 AND kategori = "resmi"',
            [package_code]
        );

        if (!packageRows[0]) {
            return res.status(404).json({ success: false, message: 'Paket resmi tidak ditemukan atau tidak aktif.' });
        }
        const packageFee = packageRows[0].fee;
        const totalEstimatedCost = packageFee * scheduled_dates.length;

        // Check user balance
        const [userRows] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
        if (userRows[0].balance < totalEstimatedCost) {
            return res.status(400).json({ success: false, message: 'Saldo tidak mencukupi untuk menjadwalkan semua pembelian.' });
        }

        // Check existing schedules for the same phone number
        const [existingSchedules] = await connection.query(
            "SELECT COUNT(*) as count FROM xl_scheduled_purchases WHERE user_id = ? AND phone_number = ? AND status = 'active'",
            [userId, phone_number]
        );

        if (existingSchedules[0].count + scheduled_dates.length > 4) {
             return res.status(400).json({ success: false, message: `Anda sudah memiliki ${existingSchedules[0].count} jadwal aktif untuk nomor ini. Anda hanya bisa menambahkan ${4-existingSchedules[0].count} jadwal lagi.` });
        }

        const insertPromises = scheduled_dates.map(date => {
            // Basic date validation
            if (new Date(date) < new Date()) {
                throw new Error(`Tanggal ${date} tidak valid atau sudah lewat.`);
            }
            return connection.query(
                'INSERT INTO xl_scheduled_purchases (user_id, phone_number, package_code, scheduled_date) VALUES (?, ?, ?, ?)',
                [userId, phone_number, package_code, date]
            );
        });

        await Promise.all(insertPromises);
        await connection.commit();

        res.status(201).json({ success: true, message: 'Pembelian berhasil dijadwalkan.' });

    } catch (error) {
        await connection.rollback();
        console.error('[XL Route] Create Scheduled Purchases error:', error);
        res.status(500).json({ success: false, message: error.message || 'Gagal membuat jadwal pembelian.' });
    } finally {
        connection.release();
    }
});


// Cancel a scheduled purchase
router.delete('/scheduled-purchases/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await pool.query(
            "UPDATE xl_scheduled_purchases SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'active'",
            [id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan atau sudah tidak aktif.' });
        }

        res.json({ success: true, message: 'Jadwal pembelian berhasil dibatalkan.' });

    } catch (error) {
        console.error('[XL Route] Cancel Scheduled Purchase error:', error);
        res.status(500).json({ success: false, message: 'Gagal membatalkan jadwal.' });
    }
});

module.exports = router;
