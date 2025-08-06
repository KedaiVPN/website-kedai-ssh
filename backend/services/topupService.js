const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../db/database.sqlite');

// Duitku API Configuration - Updated endpoints
const DUITKU_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-prod.duitku.com/api'
  : 'https://api-sandbox.duitku.com/api';

class TopupService {
  // Generate Jakarta timestamp in milliseconds
  static getJakartaTimestamp() {
    // Jakarta is UTC+7
    const now = new Date();
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return jakartaTime.getTime();
  }

  // Generate SHA256 signature for new header-based authentication
  static generateHeaderSignature(merchantCode, timestamp, apiKey) {
    const signatureString = `${merchantCode} - ${timestamp} - ${apiKey}`;
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');
    
    console.log('Header signature generation:', {
      merchantCode,
      timestamp,
      signatureString: `${merchantCode} - ${timestamp} - ***`,
      signature
    });
    
    return signature;
  }

  // Generate callback signature for validation (still uses MD5)
  static generateCallbackSignature(merchantCode, amount, merchantOrderId, apiKey) {
    const amountStr = String(amount);
    const signatureString = `${merchantCode}${amountStr}${merchantOrderId}${apiKey}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  // Create payment with new Duitku API format
  static async createPayment(userId, amount, paymentMethod = '') {
    try {
      const merchantOrderId = `TOPUP_${userId}_${Date.now()}`;
      const merchantCode = process.env.DUITKU_MERCHANT_CODE;
      const apiKey = process.env.DUITKU_API_KEY;

      if (!merchantCode || !apiKey) {
        throw new Error('Duitku configuration missing. Please set DUITKU_MERCHANT_CODE and DUITKU_API_KEY');
      }

      // Generate Jakarta timestamp and signature for headers
      const timestamp = this.getJakartaTimestamp();
      const signature = this.generateHeaderSignature(merchantCode, timestamp, apiKey);

      // Build request payload according to new documentation
      const paymentData = {
        paymentAmount: amount,
        merchantOrderId: merchantOrderId,
        productDetails: `Topup Saldo - Rp${amount.toLocaleString('id-ID')}`,
        additionalParam: '',
        merchantUserInfo: `user_${userId}`,
        customerVaName: 'Customer KedaiVPN',
        email: 'customer@kedaivpn.my.id',
        phoneNumber: '081234567890',
        itemDetails: [
          {
            name: `Topup Saldo - Rp${amount.toLocaleString('id-ID')}`,
            price: amount,
            quantity: 1
          }
        ],
        customerDetail: {
          firstName: 'Customer',
          lastName: 'KedaiVPN',
          email: 'customer@kedaivpn.my.id',
          phoneNumber: '081234567890'
        },
        callbackUrl: `${process.env.FRONTEND_URL}/api/topup/callback`,
        returnUrl: `${process.env.FRONTEND_URL}/topup/success`,
        expiryPeriod: 60
      };

      // Add paymentMethod only if specified
      if (paymentMethod && paymentMethod.trim() !== '') {
        paymentData.paymentMethod = paymentMethod;
      }

      // Set up headers according to new documentation
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-duitku-signature': signature,
        'x-duitku-timestamp': timestamp.toString(),
        'x-duitku-merchantcode': merchantCode
      };

      console.log('Creating payment with new Duitku API format:');
      console.log('Merchant Code:', merchantCode);
      console.log('Payment Amount:', paymentData.paymentAmount);
      console.log('Merchant Order ID:', paymentData.merchantOrderId);
      console.log('Product Details:', paymentData.productDetails);
      console.log('Email:', paymentData.email);
      console.log('Phone:', paymentData.phoneNumber);
      console.log('Callback URL:', paymentData.callbackUrl);
      console.log('Return URL:', paymentData.returnUrl);
      console.log('Timestamp:', timestamp);
      console.log('Headers:', {
        ...headers,
        'x-duitku-signature': '***hidden***'
      });
      console.log('Full Payload:', JSON.stringify(paymentData, null, 2));

      // Call new API endpoint
      const response = await axios.post(`${DUITKU_BASE_URL}/merchant/createInvoice`, paymentData, {
        headers: headers,
        timeout: 30000
      });

      console.log('Duitku API response status:', response.status);
      console.log('Duitku API response data:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.statusCode === '00') {
        // Save transaction to database
        const transactionData = {
          userId,
          amount,
          duitkuReference: response.data.reference,
          duitkuMerchantOrderId: merchantOrderId,
          paymentMethod: paymentMethod || response.data.paymentMethod || 'Duitku',
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
        console.error('Duitku API Error Response:', response.data);
        throw new Error(`Duitku API Error: ${response.data.statusMessage || response.data.Message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Create payment error:', error);
      
      if (error.response) {
        console.error('Duitku API Error Response Status:', error.response.status);
        console.error('Duitku API Error Response Headers:', error.response.headers);
        console.error('Duitku API Error Response Data:', JSON.stringify(error.response.data, null, 2));
        
        // More detailed error message
        const errorMessage = error.response.data?.Message || 
                           error.response.data?.statusMessage || 
                           error.response.data?.message ||
                           `HTTP ${error.response.status} Error`;
                           
        throw new Error(`Duitku API Error: ${errorMessage}`);
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

  // Validate callback signature from Duitku (still uses MD5)
  static validateCallbackSignature(merchantCode, amount, merchantOrderId, apiKey, signature) {
    try {
      const expectedSignature = this.generateCallbackSignature(merchantCode, amount, merchantOrderId, apiKey);
      console.log('Signature validation:', {
        expected: expectedSignature,
        received: signature,
        valid: expectedSignature === signature
      });
      return expectedSignature === signature;
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  // Check payment status using Duitku API (updated for new endpoint)
  static async checkPaymentStatus(merchantOrderId) {
    try {
      const merchantCode = process.env.DUITKU_MERCHANT_CODE;
      const apiKey = process.env.DUITKU_API_KEY;

      if (!merchantCode || !apiKey) {
        throw new Error('Duitku configuration missing');
      }

      const timestamp = this.getJakartaTimestamp();
      const signature = this.generateHeaderSignature(merchantCode, timestamp, apiKey);

      const requestData = {
        merchantOrderId: merchantOrderId
      };

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-duitku-signature': signature,
        'x-duitku-timestamp': timestamp.toString(),
        'x-duitku-merchantcode': merchantCode
      };

      console.log('Checking payment status with new API:', {
        merchantOrderId,
        merchantCode,
        timestamp,
        signature: '***hidden***'
      });

      const response = await axios.post(`${DUITKU_BASE_URL}/merchant/transactionStatus`, requestData, {
        headers: headers,
        timeout: 30000
      });

      console.log('Payment status response:', response.data);

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
