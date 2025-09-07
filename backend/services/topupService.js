const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../db/database.sqlite');
const TRIPAY_BASE_URL = process.env.TRIPAY_BASE_URL || 'https://tripay.co.id/api-sandbox';

class TopupService {
  static verifyEnvironmentVariables() {
    const { TRIPAY_MERCHANT_CODE, TRIPAY_API_KEY, TRIPAY_PRIVATE_KEY, BACKEND_URL, FRONTEND_URL } = process.env;
    if (!TRIPAY_MERCHANT_CODE || !TRIPAY_API_KEY || !TRIPAY_PRIVATE_KEY) {
      throw new Error('Missing required Tripay environment variables.');
    }
    return { 
      merchantCode: TRIPAY_MERCHANT_CODE, 
      apiKey: TRIPAY_API_KEY, 
      privateKey: TRIPAY_PRIVATE_KEY, 
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
    try {
      const { merchantCode, apiKey, privateKey, backendUrl, frontendUrl } = this.verifyEnvironmentVariables();
      const merchantRef = `TOPUP_${userId}_${Date.now()}`;
      const signature = this.generateSignature(merchantCode, merchantRef, amount, privateKey);
      
      const paymentData = {
        method: paymentMethod,
        merchant_ref: merchantRef,
        amount: amount,
        customer_name: userEmail.split('@')[0],
        customer_email: userEmail,
        customer_phone: phoneNumber || '',
        order_items: [{ sku: 'TOPUP-SALDO', name: 'Topup Saldo KedaiVPN', price: amount, quantity: 1 }],
        callback_url: `${backendUrl}/api/topup/callback`,
        return_url: `${frontendUrl}/topup/success?merchant_ref=${merchantRef}`,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
        signature: signature
      };

      const headers = { 'Authorization': `Bearer ${apiKey}` };
      const response = await axios.post(`${TRIPAY_BASE_URL}/transaction/create`, paymentData, { headers, timeout: 30000 });

      if (!response.data || !response.data.success) {
        throw new Error(`Tripay API Error: ${response.data.message || 'Unknown error'}`);
      }
      
      const tripayData = response.data.data;
      
      await this.saveTransaction({
        userId,
        amount, // Net amount
        amountGross: tripayData.amount, // Gross amount from Tripay
        reference: tripayData.reference,
        merchantRef: merchantRef,
        paymentMethod: paymentMethod,
        status: 'pending',
        paymentUrl: tripayData.checkout_url,
        qrCodeUrl: tripayData.qr_url
      });

      const isVA = ['BRIVA', 'BNIVA', 'MANDIRIVA'].includes(paymentMethod);

      if (paymentMethod === 'QRIS' && tripayData.qr_url) {
        return { flow: 'DIRECT_QRIS', reference: tripayData.reference, qrCodeUrl: tripayData.qr_url, amountNet: amount, amountGross: tripayData.amount };
      } else if (isVA && tripayData.pay_code) {
        return { flow: 'DIRECT_VA', reference: tripayData.reference, payCode: tripayData.pay_code, paymentName: tripayData.payment_name, instructions: tripayData.instructions, amountNet: amount, amountGross: tripayData.amount };
      } else {
        return { flow: 'REDIRECT', reference: tripayData.reference, paymentUrl: tripayData.checkout_url, amount: tripayData.amount };
      }
    } catch (error) {
      console.error('Create Payment Error:', error.response ? error.response.data : error.message);
      throw new Error(`Failed to create payment.`);
    }
  }

  static saveTransaction(data) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      const query = `
        INSERT INTO topup_transactions 
        (user_id, amount, amount_gross, duitku_reference, duitku_merchant_order_id, payment_method, status, payment_url, qr_code_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.run(query, [
        data.userId, 
        data.amount, 
        data.amountGross,
        data.reference, 
        data.merchantRef, 
        data.paymentMethod,
        data.status, 
        data.paymentUrl || null, 
        data.qrCodeUrl || null
      ], function(err) {
        db.close();
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  }

  static updateTransactionStatus(reference, status, paymentMethod = null) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      let query = 'UPDATE topup_transactions SET status = ?, updated_at = CURRENT_TIMESTAMP';
      const params = [status];
      if (paymentMethod) {
        query += ', payment_method = ?';
        params.push(paymentMethod);
      }
      query += ' WHERE duitku_reference = ?';
      params.push(reference);
      db.run(query, params, function(err) {
        db.close();
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  static getTransactionByReference(reference) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      db.get('SELECT * FROM topup_transactions WHERE duitku_reference = ?', [reference], (err, row) => {
        db.close();
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  static getUserTopupHistory(userId, limit = 20) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      db.all('SELECT * FROM topup_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?', [userId, limit], (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static async checkPaymentStatus(reference) {
    try {
      const { apiKey } = this.verifyEnvironmentVariables();
      const headers = { 'Authorization': `Bearer ${apiKey}` };
      const response = await axios.get(`${TRIPAY_BASE_URL}/transaction/detail?reference=${reference}`, { headers, timeout: 30000 });

      if (!response.data || !response.data.success) {
        return { success: false, error: 'Failed to get payment status from Tripay' };
      }
      
      const tripayData = response.data.data;
      let internalStatus = 'pending';
      switch (tripayData.status) {
        case 'PAID': internalStatus = 'success'; break;
        case 'EXPIRED': internalStatus = 'expired'; break;
        case 'FAILED': internalStatus = 'failed'; break;
        case 'REFUND': internalStatus = 'refunded'; break;
      }
      // Also, let's pass back the full tripayData object so the frontend has everything
      return { success: true, data: { ...tripayData, status: internalStatus, tripayStatus: tripayData.status } };
    } catch (error) {
      console.error('Check payment status error:', error.message);
      return { success: false, error: error.message };
    }
  }

  static getUserData(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      db.get('SELECT username, email FROM users WHERE id = ?', [userId], (err, row) => {
        db.close();
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = TopupService;
