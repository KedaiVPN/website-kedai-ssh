const axios = require('axios');
const pool = require('../db/connection');

const XL_API_KEY = process.env.XL_API_KEY || 'YOUR_API_KEY';
const XL_REQOTP_URL = process.env.XL_REQOTP_URL || 'https://golang-openapi-reqotp-xltembakservice.kmsp-store.com/v1';
const XL_LOGIN_URL = process.env.XL_LOGIN_URL || 'https://golang-openapi-login-xltembakservice.kmsp-store.com/v1';
const XL_LOGIN_MSISDN_URL = process.env.XL_LOGIN_MSISDN_URL || 'https://golang-openapi-accesstokenlist-xltembakservice.kmsp-store.com/v1';
const XL_SUBSCRIBER_INFO_URL = process.env.XL_SUBSCRIBER_INFO_URL || 'https://golang-openapi-subscriberinfo-xltembakservice.kmsp-store.com/v1';
const XL_PURCHASE_URL = process.env.XL_PURCHASE_URL || 'https://golang-openapi-packagepurchase-xltembakservice.kmsp-store.com/v1';
const XL_PACKAGE_LIST_URL = process.env.XL_PACKAGE_LIST_URL || 'https://golang-openapi-packagelist-xltembakservice.kmsp-store.com/v1';
const REQUEST_TIMEOUT = 40000; // 40 seconds

class XLService {
  // 1. Request OTP
  async requestOTP(phone) {
    try {
      const params = { api_key: XL_API_KEY, phone, method: 'OTP' };
      
      console.log('[XL Service] requestOTP REQUEST:', { phone, method: 'OTP' });
      
      const response = await axios.get(XL_REQOTP_URL, {
        params,
        timeout: REQUEST_TIMEOUT
      });
      
      // Log FULL response
      console.log('[XL Service] requestOTP FULL RESPONSE:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('[XL Service] Request OTP error:', error.message);
      throw new Error(error.response?.data?.message || 'Gagal request OTP');
    }
  }

  // 2. Login with OTP
  async loginOTP(phone, authId, otp) {
    try {
      const params = {
        api_key: XL_API_KEY,
        phone,
        method: 'OTP',
        auth_id: authId,
        otp
      };
      
      // Log request dengan masking data sensitif
      console.log('[XL Service] loginOTP REQUEST:', {
        phone,
        method: 'OTP',
        auth_id: authId.substring(0, 8) + '...' + authId.slice(-4),
        otp: '****' + otp.slice(-2),
        auth_id_length: authId.length,
        otp_length: otp.length,
        auth_id_format: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(authId) ? 'UUID' : 'OTHER'
      });
      
      const response = await axios.get(XL_LOGIN_URL, {
        params,
        timeout: REQUEST_TIMEOUT
      });
      
      // Log FULL response dari server XL
      console.log('[XL Service] loginOTP FULL RESPONSE:', JSON.stringify(response.data, null, 2));
      
      return response.data;
    } catch (error) {
      console.error('[XL Service] Login OTP ERROR:', {
        message: error.message,
        responseStatus: error.response?.status,
        responseData: JSON.stringify(error.response?.data, null, 2)
      });
      throw new Error(error.response?.data?.message || 'Gagal login dengan OTP');
    }
  }

  // Login with MSISDN (Two-step login)
  async loginWithMsisdn(msisdn) {
    try {
      // Step 1: Get session_id and token from the accesstokenlist endpoint
      const tokenListResponse = await axios.get(XL_LOGIN_MSISDN_URL, {
        params: {
          api_key: XL_API_KEY,
          msisdn
        },
        timeout: REQUEST_TIMEOUT
      });

      const tokenListData = tokenListResponse.data.data;
      if (!tokenListData || !Array.isArray(tokenListData) || tokenListData.length === 0) {
        throw new Error('Tidak ada sesi login yang ditemukan untuk nomor ini.');
      }

      // Find the most recent, valid session. Here we just take the first one.
      const sessionData = tokenListData[0];
      const authId = `${sessionData.session_id}:${sessionData.token}`;

      // Step 2: Use the session data to perform a new login and get a fresh access_token
      const loginResponse = await axios.get(XL_LOGIN_URL, {
        params: {
          api_key: XL_API_KEY,
          phone: msisdn,
          method: 'LOGIN_BY_ACCESS_TOKEN',
          auth_id: authId
        },
        timeout: REQUEST_TIMEOUT
      });

      if (!loginResponse.data || !loginResponse.data.status) {
        throw new Error(loginResponse.data.message || 'Gagal memperbarui sesi login.');
      }

      const newAccessToken = loginResponse.data.data.access_token;
      if (!newAccessToken) {
        throw new Error('Gagal mendapatkan access token baru setelah login.');
      }

      return { success: true, data: { access_token: newAccessToken } };

    } catch (error) {
      console.error(`[XL Service] Login with MSISDN for ${msisdn} failed:`, error.message);
      // Provide a more user-friendly error message
      const errorMessage = error.response?.data?.message || error.message || 'Gagal login dengan nomor HP. Pastikan nomor terdaftar dan coba lagi.';
      throw new Error(errorMessage);
    }
  }

  // Get Subscriber Info (Pulsa, Masa Aktif, etc.)
  async getSubscriberInfo(accessToken) {
    try {
      const response = await axios.get(XL_SUBSCRIBER_INFO_URL, {
        params: {
          api_key: XL_API_KEY,
          access_token: accessToken
        },
        timeout: REQUEST_TIMEOUT
      });
      return response.data;
    } catch (error) {
      console.error('[XL Service] Get Subscriber Info error:', error.message);
      throw new Error(error.response?.data?.message || 'Gagal mendapatkan info pelanggan');
    }
  }

  // 4. Purchase Package
  async purchasePackage(packageData, phone, accessToken, paymentMethod, price_or_fee) {
    try {
      let params;
      const { package_code, kategori } = packageData;

      if (kategori === 'resmi') {
        // Official package purchase flow
        params = {
          api_key: XL_API_KEY,
          package_code,
          phone,
          price_or_fee
        };
        console.log('[XL Service] Official Purchase Request:', params);
      } else {
        // Unofficial package purchase flow
        params = {
          api_key: XL_API_KEY,
          package_code,
          phone,
          access_token: accessToken,
          payment_method: paymentMethod,
          price_or_fee
        };

        // Only add ewallet_number for OVO payment method
        if (paymentMethod === 'OVO') {
          const ewallet_number = phone.startsWith('62') ? '0' + phone.substring(2) : phone;
          params.ewallet_number = ewallet_number;
        }
        console.log('[XL Service] Unofficial Purchase Request:', { ...params, access_token: '***' });
      }

      const response = await axios.get(XL_PURCHASE_URL, {
        params,
        timeout: REQUEST_TIMEOUT
      });
      
      console.log('[XL Service] Purchase Response:', JSON.stringify(response.data, null, 2));
      return response.data;

    } catch (error) {
      console.error('[XL Service] Purchase Package error:', error.message);
      if (error.response) {
        console.error('[XL Service] Purchase Error Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(error.response?.data?.message || 'Gagal membeli paket di service');
    }
  }

  // 6. Get External Package List (for Admin)
  async getExternalPackages() {
    try {
      const response = await axios.get(XL_PACKAGE_LIST_URL, {
        params: {
          api_key: XL_API_KEY,
        },
        timeout: REQUEST_TIMEOUT
      });

      if (!response.data || !response.data.status) {
        throw new Error(response.data.message || 'Gagal mengambil daftar paket eksternal');
      }

      return response.data;
    } catch (error) {
      console.error('[XL Service] Get External Packages error:', error.message);
      throw new Error(error.response?.data?.message || 'Gagal mengambil daftar paket eksternal');
    }
  }
}

module.exports = new XLService();
