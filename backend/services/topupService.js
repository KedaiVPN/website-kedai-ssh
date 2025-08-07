const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '../db/database.sqlite');

// Duitku API Configuration - Updated endpoints
const DUITKU_BASE_URL = process.env.DUITKU_BASE_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://api-prod.duitku.com/api'
    : 'https://api-sandbox.duitku.com/api'
);

class TopupService {
  // Generate accurate Jakarta timestamp in milliseconds
  static getJakartaTimestamp() {
    // Get current UTC time
    const now = new Date();
    // Jakarta is UTC+7, so add 7 hours (7 * 60 * 60 * 1000 ms)
    const jakartaOffset = 7 * 60 * 60 * 1000;
    const jakartaTime = new Date(now.getTime() + jakartaOffset);
    
    const timestamp = jakartaTime.getTime();
    
    console.log('Jakarta timestamp calculation:', {
      utcTime: now.toISOString(),
      jakartaTime: jakartaTime.toISOString(),
      timestamp: timestamp,
      timestampString: timestamp.toString()
    });
    
    return timestamp;
  }

  // Generate SHA256 signature for header-based authentication
  static generateHeaderSignature(merchantCode, timestamp, apiKey) {
    // Format exactly as specified in documentation: merchantCode + " - " + timestamp + " - " + apiKey
    const signatureString = `${merchantCode} - ${timestamp} - ${apiKey}`;
    const signature = crypto.createHash('sha256').update(signatureString).digest('hex');
    
    console.log('Header signature generation:', {
      merchantCode,
      timestamp,
      signatureString: `${merchantCode} - ${timestamp} - ***API_KEY***`,
      signature
    });
    
    return signature;
  }

  // Test signature generation with actual environment variables
  static testSignatureGeneration() {
    try {
      const { merchantCode, apiKey } = this.verifyEnvironmentVariables();
      const testTimestamp = Date.now();
      
      console.log('=== Testing Signature Generation ===');
      console.log('Test inputs:', {
        merchantCode: merchantCode,
        timestamp: testTimestamp,
        apiKey: '***HIDDEN***'
      });
      
      const signature = this.generateHeaderSignature(merchantCode, testTimestamp, apiKey);
      
      // Manual verification with actual credentials
      const manualSignatureString = `${merchantCode} - ${testTimestamp} - ${apiKey}`;
      const manualSignature = crypto.createHash('sha256').update(manualSignatureString).digest('hex');
      
      console.log('Manual verification:', {
        expected: manualSignature,
        generated: signature,
        match: manualSignature === signature
      });
      
      console.log('=== End Test ===');
      return { success: true, signature, merchantCode, timestamp: testTimestamp };
    } catch (error) {
      console.error('Test signature generation failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify environment variables
  static verifyEnvironmentVariables() {
    const merchantCode = process.env.DUITKU_MERCHANT_CODE;
    const apiKey = process.env.DUITKU_API_KEY;
    
    console.log('Environment verification:', {
      merchantCodeExists: !!merchantCode,
      merchantCodeValue: merchantCode || 'NOT_SET',
      apiKeyExists: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      nodeEnv: process.env.NODE_ENV || 'development',
      duitkuBaseUrl: DUITKU_BASE_URL
    });
    
    if (!merchantCode || !apiKey) {
      throw new Error('Missing required environment variables: DUITKU_MERCHANT_CODE or DUITKU_API_KEY');
    }
    
    return { merchantCode, apiKey };
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

  // Generate callback signature for validation (still uses MD5)
  static generateCallbackSignature(merchantCode, amount, merchantOrderId, apiKey) {
    const amountStr = String(amount);
    const signatureString = `${merchantCode}${amountStr}${merchantOrderId}${apiKey}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  // Create payment with comprehensive debugging
  static async createPayment(userId, amount, userEmail, paymentMethod = '') {
    try {
      console.log('=== Starting Payment Creation ===');
      
      // Test signature generation with real credentials first
      const testResult = this.testSignatureGeneration();
      if (!testResult.success) {
        throw new Error(`Signature test failed: ${testResult.error}`);
      }
      
      // Verify environment variables
      const { merchantCode, apiKey } = this.verifyEnvironmentVariables();

      // Get user data from database
      let userData;
      try {
        userData = await this.getUserData(userId);
      } catch (dbError) {
        console.warn('Could not fetch user data from database:', dbError.message);
        // Fallback to email-based name
        userData = { username: userEmail.split('@')[0], email: userEmail };
      }

      const merchantOrderId = `TOPUP_${userId}_${Date.now()}`;

      // Generate accurate Jakarta timestamp and signature for headers
      const timestamp = this.getJakartaTimestamp();
      const signature = this.generateHeaderSignature(merchantCode, timestamp, apiKey);

      // Extract customer name from username or email
      const customerName = userData?.username || userEmail.split('@')[0];
      const firstName = customerName.charAt(0).toUpperCase() + customerName.slice(1);

      // Build request payload according to Duitku documentation with required address fields
      const paymentData = {
        paymentAmount: amount,
        merchantOrderId: merchantOrderId,
        productDetails: "Topup Saldo KedaiVPN",
        additionalParam: '',
        merchantUserInfo: `user_${userId}`,
        customerVaName: firstName,
        email: userEmail,
        phoneNumber: '08123456789', // Use local Indonesian format first
        itemDetails: [
          {
            name: "Topup",
            price: amount,
            quantity: 1
          }
        ],
        customerDetail: {
          firstName: firstName,
          lastName: 'KedaiVPN',
          email: userEmail,
          phoneNumber: '08123456789',
          billingAddress: {
            firstName: firstName,
            lastName: 'KedaiVPN',
            address: 'Jl. Sudirman No. 123',
            city: 'Jakarta',
            postalCode: '10220',
            phone: '08123456789',
            countryCode: 'ID'
          },
          shippingAddress: {
            firstName: firstName,
            lastName: 'KedaiVPN',
            address: 'Jl. Sudirman No. 123',
            city: 'Jakarta',
            postalCode: '10220',
            phone: '08123456789',
            countryCode: 'ID'
          }
        },
        callbackUrl: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/topup/callback`,
        returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:8080'}/topup/success`,
        expiryPeriod: 60
      };

      // Add paymentMethod only if specified
      if (paymentMethod && paymentMethod.trim() !== '') {
        paymentData.paymentMethod = paymentMethod;
      }

      // Validate required fields
      if (!userEmail || !userEmail.includes('@')) {
        throw new Error('Valid user email is required');
      }

      // Set up headers according to documentation
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-duitku-signature': signature,
        'x-duitku-timestamp': timestamp.toString(),
        'x-duitku-merchantcode': merchantCode
      };

      console.log('=== Request Details ===');
      console.log('Endpoint:', `${DUITKU_BASE_URL}/merchant/createInvoice`);
      console.log('Headers:', {
        ...headers,
        'x-duitku-signature': '***HIDDEN***'
      });
      console.log('User Data:', { userId, userEmail, username: userData?.username });
      console.log('Customer Name:', firstName);
      console.log('Address Details:', {
        city: paymentData.customerDetail.billingAddress.city,
        postalCode: paymentData.customerDetail.billingAddress.postalCode,
        countryCode: paymentData.customerDetail.billingAddress.countryCode
      });
      console.log('Payload:', JSON.stringify(paymentData, null, 2));
      console.log('=== End Request Details ===');

      // Call API endpoint
      const response = await axios.post(`${DUITKU_BASE_URL}/merchant/createInvoice`, paymentData, {
        headers: headers,
        timeout: 30000
      });

      console.log('=== API Response ===');
      console.log('Status:', response.status);
      console.log('Headers:', response.headers);
      console.log('Data:', JSON.stringify(response.data, null, 2));
      console.log('=== End API Response ===');

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
      console.error('=== Create Payment Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Headers:', error.response.headers);
        console.error('Response Data:', typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data, null, 2));
        
        // Enhanced error message for debugging
        const errorMessage = error.response.data?.Message || 
                           error.response.data?.statusMessage || 
                           error.response.data?.message ||
                           error.response.data ||
                           `HTTP ${error.response.status} Error`;
                           
        throw new Error(`Duitku API Error: ${errorMessage}`);
      }
      
      console.error('=== End Create Payment Error ===');
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
      const { merchantCode, apiKey } = this.verifyEnvironmentVariables();

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

      console.log('Checking payment status with headers:', {
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
