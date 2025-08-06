
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../db/database.sqlite');

// Duitku API Configuration
const DUITKU_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://passport.duitku.com/webapi/api'
  : 'https://sandbox.duitku.com/webapi/api';

class TopupService {
  // Generate MD5 signature for Duitku API
  static generateSignature(merchantCode, amount, merchantOrderId, apiKey) {
    const signatureString = `${merchantCode}${amount}${merchantOrderId}${apiKey}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  // Generate callback signature for validation
  static generateCallbackSignature(merchantCode, amount, merchantOrderId, apiKey) {
    const signatureString = `${merchantCode}${amount}${merchantOrderId}${apiKey}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  // Create payment with Duitku API
  static async createPayment(userId, amount, paymentMethod = '') {
    try {
      const merchantOrderId = `TOPUP_${userId}_${Date.now()}`;
      const merchantCode = process.env.DUITKU_MERCHANT_CODE;
      const apiKey = process.env.DUITKU_API_KEY;

      if (!merchantCode || !apiKey) {
        throw new Error('Duitku configuration missing. Please set DUITKU_MERCHANT_CODE and DUITKU_API_KEY');
      }

      // Generate signature
      const signature = this.generateSignature(merchantCode, amount, merchantOrderId, apiKey);

      const paymentData = {
        merchantCode: merchantCode,
        paymentAmount: amount,
        paymentMethod: paymentMethod,
        merchantOrderId: merchantOrderId,
        productDetails: `Topup Saldo - Rp${amount.toLocaleString('id-ID')}`,
        merchantUserInfo: '',
        customerVaName: '',
        email: '',
        phoneNumber: '',
        itemDetails: [
          {
            name: `Topup Saldo - Rp${amount.toLocaleString('id-ID')}`,
            price: amount,
            quantity: 1
          }
        ],
        customerDetail: {
          firstName: '',
          lastName: '',
          email: '',
          phoneNumber: ''
        },
        callbackUrl: `${process.env.FRONTEND_URL}/api/topup/callback`,
        returnUrl: `${process.env.FRONTEND_URL}/topup/success`,
        signature: signature,
        expiryPeriod: 60 // 60 minutes
      };

      console.log('Creating payment with Duitku API:', {
        ...paymentData,
        signature: '***hidden***',
        apiKey: '***hidden***'
      });

      const response = await axios.post(`${DUITKU_BASE_URL}/merchant/createinvoice`, paymentData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('Duitku API response:', response.data);

      if (response.data && response.data.statusCode === '00') {
        // Save transaction to database
        const transactionData = {
          userId,
          amount,
          duitkuReference: response.data.reference,
          duitkuMerchantOrderId: merchantOrderId,
          paymentMethod,
          callbackUrl: paymentData.callbackUrl,
          returnUrl: paymentData.returnUrl,
          paymentUrl: response.data.paymentUrl,
          status: 'pending'
        };

        await this.saveTransaction(transactionData);

        return {
          success: true,
          paymentUrl: response.data.paymentUrl,
          reference: response.data.reference,
          merchantOrderId: merchantOrderId,
          amount: amount
        };
      } else {
        throw new Error(`Duitku API Error: ${response.data.statusMessage || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Create payment error:', error);
      
      if (error.response) {
        console.error('Duitku API Error Response:', error.response.data);
        throw new Error(`Duitku API Error: ${error.response.data.Message || error.response.data.statusMessage || 'Unknown error'}`);
      }
      
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  // Save transaction to database
  static saveTransaction(data) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);

      const query = `
        INSERT INTO topup_transactions 
        (user_id, amount, duitku_reference, duitku_merchant_order_id, payment_method, 
         status, callback_url, return_url, payment_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(query, [
        data.userId,
        data.amount,
        data.duitkuReference,
        data.duitkuMerchantOrderId,
        data.paymentMethod,
        data.status,
        data.callbackUrl,
        data.returnUrl,
        data.paymentUrl
      ], function(err) {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      });
    });
  }

  // Update transaction status
  static updateTransactionStatus(reference, status, paymentMethod = null) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);

      let query = 'UPDATE topup_transactions SET status = ?, updated_at = CURRENT_TIMESTAMP';
      let params = [status];

      if (paymentMethod) {
        query += ', payment_method = ?';
        params.push(paymentMethod);
      }

      query += ' WHERE duitku_reference = ?';
      params.push(reference);

      db.run(query, params, function(err) {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Get transaction by reference
  static getTransactionByReference(reference) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);

      db.get('SELECT * FROM topup_transactions WHERE duitku_reference = ?', [reference], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Get user topup history
  static getUserTopupHistory(userId, limit = 20) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);

      db.all(`
        SELECT * FROM topup_transactions 
        WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
      `, [userId, limit], (err, rows) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Validate callback signature from Duitku
  static validateCallbackSignature(merchantCode, amount, merchantOrderId, apiKey, signature) {
    try {
      const expectedSignature = this.generateCallbackSignature(merchantCode, amount, merchantOrderId, apiKey);
      return expectedSignature === signature;
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  // Check payment status using Duitku API
  static async checkPaymentStatus(merchantOrderId) {
    try {
      const merchantCode = process.env.DUITKU_MERCHANT_CODE;
      const apiKey = process.env.DUITKU_API_KEY;

      if (!merchantCode || !apiKey) {
        throw new Error('Duitku configuration missing');
      }

      const signature = crypto.createHash('md5')
        .update(`${merchantCode}${merchantOrderId}${apiKey}`)
        .digest('hex');

      const requestData = {
        merchantCode: merchantCode,
        merchantOrderId: merchantOrderId,
        signature: signature
      };

      console.log('Checking payment status:', {
        merchantOrderId,
        merchantCode,
        signature: '***hidden***'
      });

      const response = await axios.post(`${DUITKU_BASE_URL}/merchant/transactionStatus`, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Check payment status error:', error);
      return {
        success: false,
        error: error.message,
        details: error.response?.data
      };
    }
  }
}

module.exports = TopupService;
