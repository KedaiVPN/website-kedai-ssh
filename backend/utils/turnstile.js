const axios = require('axios');
const { TURNSTILE_SECRET_KEY } = require('../config');

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verify Cloudflare Turnstile token
 * @param {string} token - The Turnstile token from frontend
 * @param {string} remoteIp - Optional: The user's IP address
 * @returns {Promise<{success: boolean, errorCodes?: string[]}>}
 */
async function verifyTurnstile(token, remoteIp = null) {
  try {
    if (!token) {
      return {
        success: false,
        errorCodes: ['missing-input-response']
      };
    }

    const params = new URLSearchParams();
    params.append('secret', TURNSTILE_SECRET_KEY);
    params.append('response', token);
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const response = await axios.post(TURNSTILE_VERIFY_URL, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('[Turnstile] Verification result:', {
      success: response.data.success,
      errorCodes: response.data['error-codes']
    });

    return {
      success: response.data.success,
      errorCodes: response.data['error-codes'] || []
    };
  } catch (error) {
    console.error('[Turnstile] Verification error:', error.message);
    return {
      success: false,
      errorCodes: ['internal-error']
    };
  }
}

module.exports = { verifyTurnstile };
