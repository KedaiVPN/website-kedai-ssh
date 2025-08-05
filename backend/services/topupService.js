
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');

const dbPath = path.join(__dirname, '../db/database.sqlite');

// Duitku configuration
const DUITKU_BASE_URL = process.env.DUITKU_BASE_URL || 'https://sandbox.duitku.com/webapi/api'; // sandbox
const DUITKU_MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE;
const DUITKU_API_KEY = process.env.DUITKU_API_KEY;

class TopupService {
  // Generate signature for Duitku API
  static generateSignature(merchantCode, merchantOrderId, paymentAmount, apiKey) {
    const signatureString = merchantCode + merchantOrderId + paymentAmount + apiKey;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  // Create payment with Duitku
  static async createPayment(userId, amount, paymentMethod = '') {
    try {
      const merchantOrderId = `TOPUP_${userId}_${Date.now()}`;
      const signature = this.generateSignature(DUITKU_MERCHANT_CODE, merchantOrderId, amount, DUITKU_API_KEY);

      const paymentData = {
        merchantCode: DUITKU_MERCHANT_CODE,
        paymentAmount: amount,
        paymentMethod: paymentMethod,
        merchantOrderId: merchantOrderId,
        productDetails: `Topup Saldo - ${amount}`,
        customerEmail: '',
        customerName: '',
        customerPhone: '',
        callbackUrl: `${process.env.FRONTEND_URL}/api/topup/callback`,
        returnUrl: `${process.env.FRONTEND_URL}/topup/success`,
        signature: signature,
        expiryPeriod: 60 // 60 minutes
      };

      const response = await axios.post(`${DUITKU_BASE_URL}/merchant/createinvoice`, paymentData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.statusCode === '00') {
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
        throw new Error(`Duitku API Error: ${response.data.statusMessage}`);
      }
    } catch (error) {
      console.error('Create payment error:', error);
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
    const calculatedSignature = crypto
      .createHash('md5')
      .update(merchantCode + amount + merchantOrderId + apiKey)
      .digest('hex');
    
    return calculatedSignature === signature;
  }
}

module.exports = TopupService;
