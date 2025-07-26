import axios from 'axios';
import { RegisterRequest, RegisterResponse, SetUsernameRequest, SetUsernameResponse, LoginRequest, LoginResponse, User } from '@/types/auth';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api/auth' 
  : '/api/auth';

// Create axios instance with interceptors
const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
authApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/register';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await authApi.post('/register', data);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await authApi.post('/login', data);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async setUsername(data: SetUsernameRequest): Promise<SetUsernameResponse> {
    try {
      const response = await authApi.post('/google/set-username', data);
      
      if (response.data.success && response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await authApi.get('/profile');
      return response.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to fetch profile' };
    }
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await authApi.put('/profile', data);
      
      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data.user;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Failed to update profile' };
    }
  },

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/register';
  },

  getStoredUser(): User | null {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getToken(): string | null {
    return localStorage.getItem('authToken');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getGoogleLoginUrl(): string {
    const baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
      ? 'http://localhost:3001' 
      : '';
    return `${baseUrl}/api/auth/google`;
  }
};