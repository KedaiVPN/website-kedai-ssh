const pool = require('../db/connection');
const axios = require('axios');
const crypto = require('crypto');

const TRIPAY_BASE_URL = process.env.TRIPAY_BASE_URL || 'https://tripay.co.id/api-sandbox';

class TopupService {
  static verifyEnvironmentVariables() {
    const { TRIPAY_MERCHANT_CODE, TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, BACKEND_URL, FRONTEND_URL } = process.env;
    if (!TRIPAY_MERCHANT_CODE || !TRIPAY_API_KEY || !TRIPAY_PRIVATE_KEY) {
      throw new Error('Missing required Tripay environment variables.');
    }
    return {
      merchantCode: TRIPAY_MERCHANT_CODE, apiKey: TRIPAY_API_KEY, privateKey: TRIPAY_PRIVATE_KEY,
      backendUrl: BACKEND_URL || 'http://localhost:3001',
      frontendUrl: FRONTEND_URL || 'http://localhost:8080'
    };
  }

  static generateSignature(merchantCode, merchantRef, amount, privateKey) {
    const signatureString = `${merchantCode}${merchantRef}${amount}`;
    return crypto.createHmac('sha256', privateKey).update(signatureString).digest('hex');
  }

  static verifyCallbackSignature(callbackSignature, rawBody, privateKey) {
    try {
      const expectedSignature = crypto.createHmac('sha256', privateKey).update(rawBody).digest('hex');
      return expectedSignature === callbackSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  static async createPayment(userId, amount, userEmail, paymentMethod = 'QRIS', phoneNumber = null) {
    const { merchantCode, apiKey, privateKey, backendUrl, frontendUrl } = this.verifyEnvironmentVariables();
    const merchantRef = `TOPUP_${userId}_${Date.now()}`;
    const signature = this.generateSignature(merchantCode, merchantRef, amount, privateKey);

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      // Step 1: Save initial transaction record
      const [initialResult] = await connection.execute(
        `INSERT INTO topup_transactions (user_id, amount, duitku_merchant_order_id, payment_method, status) VALUES (?, ?, ?, ?, 'creating')`,
        [userId, amount, merchantRef, paymentMethod]
      );
      const transactionId = initialResult.insertId;

      // Step 2: Call Tripay API
      const paymentData = {
        method: paymentMethod, merchant_ref: merchantRef, amount,
        customer_name: userEmail.split('@')[0], customer_email: userEmail, customer_phone: phoneNumber || '',
        order_items: [{ sku: 'TOPUP-SALDO', name: 'Topup Saldo KedaiVPN', price: amount, quantity: 1 }],
        callback_url: `${backendUrl}/api/topup/callback`,
        return_url: `${frontendUrl}/topup/result?merchant_ref=${merchantRef}`,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        signature
      };

      const headers = { 'Authorization': `Bearer ${apiKey}` };
      const response = await axios.post(`${TRIPAY_BASE_URL}/transaction/create`, paymentData, { headers, timeout: 30000 });

      if (!response.data || !response.data.success) {
        throw new Error(`Tripay API Error: ${response.data.message || 'Unknown error'}`);
      }
      const tripayData = response.data.data;

      // Step 3: Update transaction with Tripay data
      await connection.execute(
        `UPDATE topup_transactions SET status = 'pending', amount_gross = ?, duitku_reference = ?, payment_url = ?, qr_code_url = ? WHERE id = ?`,
        [tripayData.amount, tripayData.reference, tripayData.checkout_url, tripayData.qr_url, transactionId]
      );

      await connection.commit();

      const isVA = ['BRIVA', 'BNIVA', 'MANDIRIVA'].includes(paymentMethod);
      if (paymentMethod === 'QRIS' && tripayData.qr_url) {
        return { flow: 'DIRECT_QRIS', ...tripayData };
      } else if (isVA && tripayData.pay_code) {
        return { flow: 'DIRECT_VA', ...tripayData };
      } else {
        return { flow: 'REDIRECT', ...tripayData };
      }

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Create Payment Error:', error.response ? error.response.data : error.message);
      throw new Error(`Gagal membuat pembayaran.`);
    } finally {
      if (connection) connection.release();
    }
  }

  static async updateTransactionStatus(reference, status, paymentMethod = null) {
    let query = 'UPDATE topup_transactions SET status = ?';
    const params = [status];
    if (paymentMethod) {
      query += ', payment_method = ?';
      params.push(paymentMethod);
    }
    query += ' WHERE duitku_reference = ?';
    params.push(reference);

    const [result] = await pool.execute(query, params);
    return { changes: result.affectedRows };
  }

  static async getTransactionByReference(reference) {
    const [rows] = await pool.execute('SELECT * FROM topup_transactions WHERE duitku_reference = ?', [reference]);
    return rows[0];
  }

  static async getUserTopupHistory(userId, limit = 20) {
    const [rows] = await pool.execute('SELECT * FROM topup_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit]);
    return rows;
  }

  static async checkPaymentStatus(reference) {
    try {
      const { apiKey } = this.verifyEnvironmentVariables();
      const headers = { 'Authorization': `Bearer ${apiKey}` };
      const response = await axios.get(`${TRIPAY_BASE_URL}/transaction/detail?reference=${reference}`, { headers, timeout: 30000 });

      if (!response.data || !response.data.success) {
        return { success: false, error: 'Gagal mendapatkan status pembayaran dari Tripay' };
      }

      const tripayData = response.data.data;
      return { success: true, data: tripayData };
    } catch (error) {
      console.error('Check payment status error:', error.message);
      return { success: false, error: error.message };
    }
  }

  static async getUserData(userId) {
    const [rows] = await pool.execute('SELECT username, email FROM users WHERE id = ?', [userId]);
    return rows[0];
  }
}

module.exports = TopupService;
