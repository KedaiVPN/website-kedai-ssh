
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const Duitku = require('duitku');

const dbPath = path.join(__dirname, '../db/database.sqlite');

// Initialize Duitku client
const duitku = new Duitku({
  merchantCode: process.env.DUITKU_MERCHANT_CODE,
  apiKey: process.env.DUITKU_API_KEY,
  sandbox: process.env.NODE_ENV !== 'production' // Use sandbox in development
});

class TopupService {
  // Create payment with Duitku
  static async createPayment(userId, amount, paymentMethod = '') {
    try {
      const merchantOrderId = `TOPUP_${userId}_${Date.now()}`;

      const paymentData = {
        paymentAmount: amount,
        paymentMethod: paymentMethod,
        merchantOrderId: merchantOrderId,
        productDetails: `Topup Saldo - ${amount}`,
        customerEmail: '',
        customerName: '',
        customerPhone: '',
        callbackUrl: `${process.env.FRONTEND_URL}/api/topup/callback`,
        returnUrl: `${process.env.FRONTEND_URL}/topup/success`,
        expiryPeriod: 60 // 60 minutes
      };

      console.log('Creating payment with Duitku:', paymentData);

      const response = await duitku.createInvoice(paymentData);

      console.log('Duitku response:', response);

      if (response.statusCode === '00') {
        // Save transaction to database
        const transactionData = {
          userId,
          amount,
          duitkuReference: response.reference,
          duitkuMerchantOrderId: merchantOrderId,
          paymentMethod,
          callbackUrl: paymentData.callbackUrl,
          returnUrl: paymentData.returnUrl,
          paymentUrl: response.paymentUrl,
          status: 'pending'
        };

        await this.saveTransaction(transactionData);

        return {
          success: true,
          paymentUrl: response.paymentUrl,
          reference: response.reference,
          merchantOrderId: merchantOrderId,
          amount: amount
        };
      } else {
        throw new Error(`Duitku API Error: ${response.statusMessage || 'Unknown error'}`);
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

  // Validate callback signature from Duitku using the npm package
  static validateCallbackSignature(merchantCode, amount, merchantOrderId, apiKey, signature) {
    try {
      return duitku.validateSignature({
        merchantCode,
        amount,
        merchantOrderId,
        apiKey
      }, signature);
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  // Check payment status using Duitku API
  static async checkPaymentStatus(merchantOrderId) {
    try {
      const response = await duitku.checkTransaction({
        merchantOrderId: merchantOrderId
      });
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Check payment status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = TopupService;
