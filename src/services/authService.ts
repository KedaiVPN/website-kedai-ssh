import axios from 'axios';
import { RegisterRequest, RegisterResponse, SetUsernameRequest, SetUsernameResponse, LoginRequest, LoginResponse } from '@/types/auth';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api/auth' 
  : '/api/auth';

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

    try {
      // Enhanced token validation
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        console.log('AuthService: Token expired, removing from localStorage');
        localStorage.removeItem('auth_token');
        return false;
      }

      // Check if token has required fields
      if (!payload.id || !payload.email) {
        console.log('AuthService: Invalid token structure');
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
      if (!token) return false;

      const response = await axios.get(`${API_BASE_URL}/validate-token`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data.success;
    } catch (error) {
      console.error('AuthService: Server token validation failed:', error);
      localStorage.removeItem('auth_token');
      return false;
    }
  },

  getGoogleLoginUrl(): string {
    const state = this.generateSecureState();
    sessionStorage.setItem('oauth_state', state);
    this.logAuthEvent('google_oauth_initiated', { state });
    return `${API_BASE_URL}/google?state=${state}`;
  },

  logout(): void {
    console.log('AuthService: Performing comprehensive logout cleanup');
    
    // Log logout event
    this.logAuthEvent('logout', { timestamp: new Date().toISOString() });
    
    // Clear all storage
    localStorage.removeItem('auth_token');
    sessionStorage.clear();
    
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }

    // Clear Google OAuth session by making a request to logout endpoint
    this.clearGoogleSession();
  },

  async clearGoogleSession(): Promise<void> {
    try {
      // This will clear Google OAuth session on the server
      await axios.post(`${API_BASE_URL}/logout`);
    } catch (error) {
      console.error('AuthService: Error clearing Google session:', error);
    }
  },

  generateSecureState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  validateOAuthState(state: string): boolean {
    const storedState = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');
    return storedState === state;
  },

  logAuthEvent(event: string, data?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userAgent: navigator.userAgent,
      url: window.location.href,
      data
    };
    
    console.log('AuthService Event:', logEntry);
    
    // Store in sessionStorage for debugging (limited to recent events)
    const authLogs = JSON.parse(sessionStorage.getItem('auth_logs') || '[]');
    authLogs.push(logEntry);
    
    // Keep only last 10 events
    if (authLogs.length > 10) {
      authLogs.shift();
    }
    
    sessionStorage.setItem('auth_logs', JSON.stringify(authLogs));
  }
};
