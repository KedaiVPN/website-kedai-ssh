
import axios from 'axios';
import { Server, UserVPNAccount, CreateAccountRequest, RenewAccountRequest, VPNProtocol } from '@/types/vpn';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3001/api'
  : '/api';

// Create axios instance with interceptors for authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: () => true,
});

// Add token to requests that need authentication
api.interceptors.request.use((config) => {
  // Only add token for protected endpoints
  const protectedEndpoints = ['/accounts', '/create', '/delete', '/renew', '/servers', '/trial'];
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
  async (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message
    });
    
    // Handle token expiration - redirect to login for re-authentication
    if (error.response?.status === 401 && error.response?.data?.code === 'TOKEN_EXPIRED') {
      console.log('Token expired, redirecting to login...');
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Other auth errors - redirect to login
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

  async getAccountStatus(accountId: number) {
    try {
      console.log('Getting status for account:', accountId);
      const response = await api.get(`/accounts/${accountId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting account status:', error);
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
      console.log('Creating account with data:', accountData);
      const response = await api.post('/create', accountData);
      return response.data;
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },

  async trialAccount(protocol: VPNProtocol, serverId: string) {
    try {
      console.log('Creating trial account with data:', { protocol, serverId });
      const response = await api.post('/trial', { protocol, serverId });
      return response.data;
    } catch (error) {
      console.error('Error creating trial account:', error);
      throw error;
    }
  },

  async renewAccount(renewData: RenewAccountRequest) {
    try {
      console.log('Renewing account with data:', renewData);
      const response = await api.post('/renew', renewData);
      return response.data;
    } catch (error) {
      console.error('Error renewing account:', error);
      throw error;
    }
  },

  async deleteAccount(accountId: number) {
    try {
      console.log('Deleting account:', accountId);
      const response = await api.delete(`/delete/${accountId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },

  async createTrialAccount(protocol: VPNProtocol, serverId: number, turnstileToken: string) {
    try {
      console.log('Creating trial account:', { protocol, serverId });
      const response = await api.post('/trial', { protocol, serverId, turnstileToken });
      return response.data;
    } catch (error) {
      console.error('Error creating trial account:', error);
      throw error;
    }
  }
};
