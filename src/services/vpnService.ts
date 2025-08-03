
import axios from 'axios';
import { Server, UserVPNAccount, CreateAccountRequest } from '@/types/vpn';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api' 
  : '/api';

// Create axios instance with interceptors for authentication
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests that need authentication
api.interceptors.request.use((config) => {
  // Only add token for protected endpoints
  const protectedEndpoints = ['/accounts', '/create'];
  const needsAuth = protectedEndpoints.some(endpoint => config.url?.includes(endpoint));
  
  if (needsAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  console.log(`Making request to: ${config.baseURL}${config.url}`);
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const vpnService = {
  async getServers(): Promise<Server[]> {
    try {
      const response = await api.get('/servers');
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching servers:', error);
      throw error;
    }
  },

  async getUserAccounts(): Promise<UserVPNAccount[]> {
    try {
      const response = await api.get('/accounts');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      throw error;
    }
  },

  async createAccount(accountData: Omit<CreateAccountRequest, 'userId'>) {
    try {
      // Fix: Use correct endpoint '/create' instead of '/create/account'
      console.log('Creating account with data:', accountData);
      const response = await api.post('/create', accountData);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }
};
