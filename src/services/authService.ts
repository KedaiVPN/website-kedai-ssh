import axios from 'axios';
import { RegisterRequest, RegisterResponse, SetUsernameRequest, SetUsernameResponse, LoginRequest, LoginResponse } from '@/types/auth';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api/auth' 
  : '/api/auth';

// Enhanced browser detection for OAuth compatibility
const detectBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('miuibrowser')) return 'miui';
  if (ua.includes('samsungbrowser')) return 'samsung';
  if (ua.includes('ucbrowser')) return 'uc';
  if (ua.includes('chrome') && !ua.includes('edg')) return 'chrome';
  if (ua.includes('firefox')) return 'firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'safari';
  if (ua.includes('edg')) return 'edge';
  
  return 'other';
};

// Enhanced token validation
const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Validate each part can be base64 decoded
    atob(parts[0]); // header
    atob(parts[1]); // payload
    return true;
  } catch (error) {
    return false;
  }
};

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, data);
      if (response.data.success && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        this.logAuthEvent('register_success', { email: data.email });
      }
      return response.data;
    } catch (error) {
      this.logAuthEvent('register_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async verifyEmail(data: { email: string; code?: string; token?: string; type?: string }): Promise<any> {
    try {
      console.log('AuthService: Verifying email with data:', data);
      const response = await axios.post(`${API_BASE_URL}/verify-email`, data);
      console.log('AuthService: Verify email response:', response.data);
      
      if (response.data.success && response.data.token) {
        console.log('AuthService: Saving token to localStorage');
        localStorage.setItem('auth_token', response.data.token);
        this.logAuthEvent('email_verify_success', { email: data.email });
      }
      return response.data;
    } catch (error) {
      console.error('AuthService: Verify email error:', error);
      this.logAuthEvent('email_verify_error', { email: data.email, error: error instanceof Error ? error.message : 'Unknown error' });
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async resendVerification(data: { email: string }): Promise<any> {
    try {
      console.log('AuthService: Resending verification to:', data.email);
      const response = await axios.post(`${API_BASE_URL}/resend-verification`, data);
      console.log('AuthService: Resend verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthService: Resend verification error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async setUsername(data: SetUsernameRequest): Promise<SetUsernameResponse> {
    try {
      console.log('AuthService: Setting username with data:', data);
      const response = await axios.post(`${API_BASE_URL}/google/set-username`, data);
      console.log('AuthService: Set username response:', response.data);
      
      if (response.data.success && response.data.token) {
        console.log('AuthService: Saving token to localStorage');
        localStorage.setItem('auth_token', response.data.token);
        this.logAuthEvent('username_set_success', { email: data.email });
      }
      return response.data;
    } catch (error) {
      console.error('AuthService: Set username error:', error);
      this.logAuthEvent('username_set_error', { email: data.email, error: error instanceof Error ? error.message : 'Unknown error' });
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, data);
      if (response.data.success && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
        this.logAuthEvent('login_success', { email: data.email });
      }
      return response.data;
    } catch (error) {
      this.logAuthEvent('login_error', { email: data.email, error: error instanceof Error ? error.message : 'Unknown error' });
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      console.log('AuthService: No token found');
      return false;
    }

    // Enhanced token format validation
    if (!isValidTokenFormat(token)) {
      console.log('AuthService: Invalid token format');
      localStorage.removeItem('auth_token');
      return false;
    }

    try {
      // Enhanced token payload validation
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired with 30 second buffer
      if (payload.exp && payload.exp < (currentTime + 30)) {
        console.log('AuthService: Token expired or expiring soon, removing from localStorage');
        localStorage.removeItem('auth_token');
        return false;
      }

      // Enhanced required fields validation
      if (!payload.id || !payload.email) {
        console.log('AuthService: Invalid token structure - missing required fields');
        localStorage.removeItem('auth_token');
        return false;
      }

      // Additional security check - validate token signature format
      const signature = token.split('.')[2];
      if (!signature || signature.length < 10) {
        console.log('AuthService: Invalid token signature');
        localStorage.removeItem('auth_token');
        return false;
      }

      console.log('AuthService: Valid token found for user:', payload.email);
      return true;
    } catch (error) {
      console.error('AuthService: Error validating token:', error);
      localStorage.removeItem('auth_token');
      return false;
    }
  },

  async validateTokenWithServer(): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token || !isValidTokenFormat(token)) return false;

      const response = await axios.get(`${API_BASE_URL}/validate-token`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'X-Browser-Type': detectBrowser()
        },
        timeout: 5000 // 5 second timeout
      });

      return response.data.success;
    } catch (error) {
      console.error('AuthService: Server token validation failed:', error);
      
      // Only remove token if it's definitely invalid (not network error)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        localStorage.removeItem('auth_token');
      }
      
      return false;
    }
  },

  getGoogleLoginUrl(): string {
    const browserType = detectBrowser();
    
    // Enhanced OAuth URL with browser info
    const params = new URLSearchParams({
      browser: browserType,
      timestamp: Date.now().toString()
    });
    
    this.logAuthEvent('google_oauth_initiated', { 
      browser: browserType,
      userAgent: navigator.userAgent,
      timestamp: Date.now()
    });
    
    const baseUrl = `${API_BASE_URL}/google`;
    return `${baseUrl}?${params}`;
  },

  logout(): void {
    console.log('AuthService: Performing enhanced logout cleanup');
    
    const browserType = detectBrowser();
    
    // Log logout event with browser info
    this.logAuthEvent('logout', { 
      timestamp: new Date().toISOString(),
      browser: browserType
    });
    
    // Enhanced storage cleanup
    try {
      // Clear localStorage
      localStorage.removeItem('auth_token');
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any browser-specific storage
      if (browserType === 'miui' || browserType === 'samsung') {
        // Additional cleanup for mobile browsers
        console.log('AuthService: Performing mobile browser specific cleanup');
        
        // Force clear any cached auth data
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth') || key.includes('oauth') || key.includes('google')) {
            localStorage.removeItem(key);
          }
        });
      }
      
      // Clear any cached data
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
        });
      }
    } catch (error) {
      console.error('AuthService: Error during logout cleanup:', error);
    }

    // Clear Google OAuth session on server
    this.clearGoogleSession();
  },

  async clearGoogleSession(): Promise<void> {
    try {
      const browserType = detectBrowser();
      
      // Enhanced server session clearing
      await axios.post(`${API_BASE_URL}/logout`, {
        browser: browserType,
        timestamp: Date.now()
      }, {
        timeout: 3000 // 3 second timeout for logout
      });
      
      console.log('AuthService: Server session cleared successfully');
    } catch (error) {
      console.error('AuthService: Error clearing Google session:', error);
      // Don't throw error as logout should continue even if server call fails
    }
  },

  // Enhanced OAuth state management (client-side validation)
  generateSecureState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const randomString = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // Add timestamp and browser info for additional validation
    const stateData = {
      random: randomString,
      timestamp: Date.now(),
      browser: detectBrowser()
    };
    
    return btoa(JSON.stringify(stateData));
  },

  validateOAuthState(state: string): boolean {
    try {
      const stateData = JSON.parse(atob(state));
      
      // Validate timestamp (max 10 minutes old)
      const age = Date.now() - stateData.timestamp;
      if (age > 10 * 60 * 1000) {
        console.error('OAuth state expired:', { age, maxAge: 600000 });
        return false;
      }
      
      // Validate browser consistency
      if (stateData.browser !== detectBrowser()) {
        console.warn('OAuth browser mismatch:', { 
          stored: stateData.browser, 
          current: detectBrowser() 
        });
        // Don't fail on browser mismatch as user might have changed browsers
      }
      
      return true;
    } catch (error) {
      console.error('OAuth state validation error:', error);
      return false;
    }
  },

  logAuthEvent(event: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userAgent: navigator.userAgent,
      browser: detectBrowser(),
      url: window.location.href,
      data
    };
    
    console.log('AuthService Event:', logEntry);
    
    // Enhanced logging for browser compatibility debugging
    const authLogs = JSON.parse(sessionStorage.getItem('auth_logs') || '[]');
    authLogs.push(logEntry);
    
    // Keep only last 15 events (increased from 10)
    if (authLogs.length > 15) {
      authLogs.shift();
    }
    
    try {
      sessionStorage.setItem('auth_logs', JSON.stringify(authLogs));
    } catch (error) {
      console.warn('Failed to store auth logs:', error);
      // Clear old logs and try again
      sessionStorage.removeItem('auth_logs');
      try {
        sessionStorage.setItem('auth_logs', JSON.stringify([logEntry]));
      } catch (retryError) {
        console.error('Failed to store auth logs on retry:', retryError);
      }
    }
  }
};
