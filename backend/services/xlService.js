const axios = require('axios');
const pool = require('../db/connection');

const XL_API_KEY = process.env.XL_API_KEY || 'YOUR_API_KEY';
const XL_GOLANG_API_KEY = process.env.XL_GOLANG_API_KEY || 'your_golang_api_key_here';
const XL_REQOTP_URL = process.env.XL_REQOTP_URL || 'https://golang-openapi-reqotp-xltembakservice.kmsp-store.com/v1';
const XL_LOGIN_URL = process.env.XL_LOGIN_URL || 'https://golang-openapi-login-xltembakservice.kmsp-store.com/v1';
const XL_PREVIOUS_LOGIN_URL = 'https://golang-openapi-accesstokenlist-xltembakservice.kmsp-store.com/v1';
const XL_QUOTA_URL = process.env.XL_QUOTA_URL || 'https://golang-openapi-quotadetails-xltembakservice.kmsp-store.com/v1';
const XL_PURCHASE_URL = process.env.XL_PURCHASE_URL || 'https://golang-openapi-packagepurchase-xltembakservice.kmsp-store.com/v1';
const REQUEST_TIMEOUT = 40000; // 40 seconds

class XLService {
  // 1. Login with Previous Number
  async loginWithPreviousNumber(msisdn) {
    try {
      const response = await axios.get(XL_PREVIOUS_LOGIN_URL, {
        params: { api_key: XL_GOLANG_API_KEY, msisdn },
        timeout: REQUEST_TIMEOUT
      });
      return response.data;
    } catch (error) {
      console.error('[XL Service] Login with Previous Number error:', error.message);
      throw new Error(error.response?.data?.message || 'Gagal login dengan nomor sebelumnya');
    }
  }

  // 2. Request OTP
  async requestOTP(phone) {
    try {
      const response = await axios.get(XL_REQOTP_URL, {
        params: { api_key: XL_API_KEY, phone, method: 'OTP' },
        timeout: REQUEST_TIMEOUT
      });
      return response.data;
    } catch (error) {
      console.error('[XL Service] Request OTP error:', error.message);
      throw new Error(error.response?.data?.message || 'Gagal request OTP');
    }
  }

  // 3. Login with OTP
  async loginOTP(phone, authId, otp) {
    try {
      const response = await axios.get(XL_LOGIN_URL, {
        params: { 
          api_key: XL_API_KEY, 
          phone, 
          method: 'OTP', 
          auth_id: authId, 
          otp 
        },
        timeout: REQUEST_TIMEOUT
      });
      return response.data;
    } catch (error) {
      console.error('[XL Service] Login OTP error:', error.message);
      throw new Error(error.response?.data?.message || 'Gagal login dengan OTP');
    }
  }

  // 4. Get Quota Details
  async getQuotaDetails(accessToken) {
    try {
      const response = await axios.get(XL_QUOTA_URL, {
        params: { api_key: XL_API_KEY, access_token: accessToken },
        timeout: REQUEST_TIMEOUT
      });
      return response.data;
    } catch (error) {
      console.error('[XL Service] Get Quota error:', error.message);
      throw new Error(error.response?.data?.message || 'Gagal mendapatkan detail quota');
    }
  }

  // 5. Purchase Package
  async purchasePackage(packageCode, phone, accessToken, paymentMethod) {
    try {
      // Get package info from database
      const [packageRow] = await pool.query(
        'SELECT * FROM xl_packages WHERE package_code = ? AND is_active = 1', 
        [packageCode]
      );
      
      if (!packageRow[0]) {
        throw new Error('Package tidak ditemukan');
      }
      
      const packageData = packageRow[0];
      
      const response = await axios.get(XL_PURCHASE_URL, {
        params: {
          api_key: XL_API_KEY,
          package_code: packageCode,
          phone,
          access_token: accessToken,
          payment_method: paymentMethod,
          price_or_fee: packageData.price
        },
        timeout: REQUEST_TIMEOUT
      });
      
      return { 
        ...response.data, 
        packageFee: packageData.fee,
        packagePrice: packageData.price,
        packageName: packageData.name
      };
    } catch (error) {
      console.error('[XL Service] Purchase Package error:', error.message);
      throw new Error(error.response?.data?.message || 'Gagal membeli paket');
    }
  }
}

module.exports = new XLService();
