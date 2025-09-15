import axios from 'axios';
import { RegisterRequest, RegisterResponse, SetUsernameRequest, SetUsernameResponse, LoginRequest, LoginResponse } from '@/types/auth';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api/auth' 
  : '/api/auth';

const API_PASSWORD_RESET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api/password-reset'
  : '/api/password-reset';

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, data);
      if (response.data.success && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
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
      }
      return response.data;
    } catch (error) {
      console.error('AuthService: Verify email error:', error);
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
      }
      return response.data;
    } catch (error) {
      console.error('AuthService: Set username error:', error);
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
      }
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async refreshToken(): Promise<any> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.post(`${API_BASE_URL}/refresh-token`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async requestPasswordReset(email: string): Promise<any> {
    try {
      console.log('AuthService: Requesting password reset for:', email);
      const response = await axios.post(`${API_PASSWORD_RESET_URL}/forgot-password`, { email });
      console.log('AuthService: Password reset request response:', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthService: Password reset request error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async verifyResetToken(token: string): Promise<any> {
    try {
      console.log('AuthService: Verifying reset token');
      const response = await axios.get(`${API_PASSWORD_RESET_URL}/verify-reset-token?token=${token}`);
      console.log('AuthService: Reset token verification response:', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthService: Reset token verification error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async resetPassword(token: string, password: string, confirmPassword: string): Promise<any> {
    try {
      console.log('AuthService: Resetting password with token');
      const response = await axios.post(`${API_PASSWORD_RESET_URL}/reset-password`, {
        token,
        password,
        confirmPassword
      });
      console.log('AuthService: Password reset response:', response.data);
      return response.data;
    } catch (error) {
      console.error('AuthService: Password reset error:', error);
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const isAuth = !!token;
    console.log('AuthService: isAuthenticated check:', isAuth);
    return isAuth;
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  getGoogleLoginUrl(): string {
    return `${API_BASE_URL}/google`;
  },

  logout(): void {
    console.log('AuthService: Performing logout cleanup');
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
  }
};
