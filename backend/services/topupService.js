const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../db/database.sqlite');

// Tripay API Configuration
const TRIPAY_BASE_URL = process.env.TRIPAY_BASE_URL || 'https://tripay.co.id/api-sandbox';

class TopupService {
  // Verify environment variables
  static verifyEnvironmentVariables() {
    const merchantCode = process.env.TRIPAY_MERCHANT_CODE;
    const apiKey = process.env.TRIPAY_API_KEY;
    const privateKey = process.env.TRIPAY_PRIVATE_KEY;
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    
    console.log('Tripay environment verification:', {
      merchantCodeExists: !!merchantCode,
      merchantCodeValue: merchantCode || 'NOT_SET',
      apiKeyExists: !!apiKey,
      privateKeyExists: !!privateKey,
      tripayBaseUrl: TRIPAY_BASE_URL,
      backendUrl: backendUrl,
      frontendUrl: frontendUrl
    });
    
    if (!merchantCode || !apiKey || !privateKey) {
      throw new Error('Missing required environment variables: TRIPAY_MERCHANT_CODE, TRIPAY_API_KEY, or TRIPAY_PRIVATE_KEY');
    }
    
    return { merchantCode, apiKey, privateKey, backendUrl, frontendUrl };
  }

  // Generate HMAC-SHA256 signature for Tripay
  static generateSignature(merchantCode, merchantRef, amount, privateKey) {
    const signatureString = `${merchantCode}${merchantRef}${amount}`;
    const signature = crypto.createHmac('sha256', privateKey).update(signatureString).digest('hex');
    
    console.log('Tripay signature generation:', {
      merchantCode,
      merchantRef,
      amount,
      signatureString: `${merchantCode}${merchantRef}${amount}`,
      signature
    });
    
    return signature;
  }

  // Verify callback signature from Tripay
  static verifyCallbackSignature(callbackSignature, rawBody, privateKey) {
    try {
      const expectedSignature = crypto.createHmac('sha256', privateKey).update(rawBody).digest('hex');
      console.log('Tripay callback signature verification:', {
        expected: expectedSignature,
        received: callbackSignature,
        valid: expectedSignature === callbackSignature
      });
      return expectedSignature === callbackSignature;
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  // Create payment with Tripay
  static async createPayment(userId, amount, userEmail, paymentMethod = 'QRIS') {
    try {
      console.log('=== Starting Tripay Payment Creation ===');
      
      const { merchantCode, apiKey, privateKey, backendUrl, frontendUrl } = this.verifyEnvironmentVariables();
      const merchantRef = `TOPUP_${userId}_${Date.now()}`;
      
      // Generate signature
      const signature = this.generateSignature(merchantCode, merchantRef, amount, privateKey);
      
      // Build URLs
      const callbackUrl = `${backendUrl}/api/topup/callback`;
      const returnUrl = `${frontendUrl}/topup/success?merchant_ref=${merchantRef}`;
      
      // Build request payload
      const paymentData = {
        method: paymentMethod || 'QRIS',
        merchant_ref: merchantRef,
        amount: amount,
        customer_name: userEmail.split('@')[0],
        customer_email: userEmail,
        customer_phone: '',
        order_items: [
          {
            sku: 'TOPUP-SALDO',
            name: 'Topup Saldo KedaiVPN',
            price: amount,
            quantity: 1,
            product_url: frontendUrl,
            image_url: ''
          }
        ],
        callback_url: callbackUrl,
        return_url: returnUrl,
        expired_time: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        signature: signature
      };

      // Set up headers
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };

      console.log('=== Tripay Request Details ===');
      console.log('Endpoint:', `${TRIPAY_BASE_URL}/transaction/create`);
      console.log('User Data:', { userId, userEmail });
      console.log('URLs:', { callbackUrl, returnUrl });
      console.log('Payload:', JSON.stringify(paymentData, null, 2));
      console.log('=== End Request Details ===');

      // Call Tripay API
      const response = await axios.post(`${TRIPAY_BASE_URL}/transaction/create`, paymentData, {
        headers: headers,
        timeout: 30000
      });

      console.log('=== Tripay API Response ===');
      console.log('Status:', response.status);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      console.log('=== End API Response ===');

      if (response.data && response.data.success) {
        const tripayData = response.data.data;
        
        // Save transaction to database
        const transactionData = {
          userId,
          amount,
          reference: tripayData.reference,
          merchantRef: merchantRef,
          paymentMethod: paymentMethod || 'QRIS',
          callbackUrl: callbackUrl,
          returnUrl: returnUrl,
          paymentUrl: tripayData.checkout_url,
          status: 'pending'
        };

        await this.saveTransaction(transactionData);

        return {
          success: true,
          paymentUrl: tripayData.checkout_url,
          reference: tripayData.reference,
          merchantRef: merchantRef,
          amount: amount
        };
      } else {
        console.error('Tripay API Error Response:', response.data);
        throw new Error(`Tripay API Error: ${response.data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('=== Create Payment Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', error.response.data);
      }
      
      console.error('=== End Create Payment Error ===');
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  // Save transaction to database (using existing duitku columns for compatibility)
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
        data.reference, // Map Tripay reference to duitku_reference
        data.merchantRef, // Map Tripay merchant_ref to duitku_merchant_order_id
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

      query += ' WHERE duitku_reference = ?'; // Using duitku_reference column for Tripay reference
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

  // Check payment status using Tripay API
  static async checkPaymentStatus(reference) {
    try {
      const { apiKey } = this.verifyEnvironmentVariables();

      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };

      console.log('Checking payment status with Tripay:', { reference });

      const response = await axios.get(`${TRIPAY_BASE_URL}/transaction/detail?reference=${reference}`, {
        headers: headers,
        timeout: 30000
      });

      console.log('Tripay payment status response:', response.data);

      if (response.data && response.data.success) {
        const tripayData = response.data.data;
        
        // Map Tripay status to internal status
        let internalStatus = 'pending';
        switch (tripayData.status) {
          case 'PAID':
            internalStatus = 'success';
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

        return {
          success: true,
          data: {
            status: internalStatus,
            tripayStatus: tripayData.status,
            amount: tripayData.amount,
            paymentMethod: tripayData.payment_method
          }
        };
      }

      return {
        success: false,
        error: 'Failed to get payment status'
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

  // Get user data from database
  static getUserData(userId) {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(dbPath);
      
      db.get('SELECT username, email FROM users WHERE id = ?', [userId], (err, row) => {
        db.close();
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
}

module.exports = TopupService;
