
import axios from 'axios';
import { UserBalance, BalanceTransaction } from '@/types/vpn';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api' 
  : '/api';

// Create axios instance with interceptors for authentication
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const balanceService = {
  // Get current user balance
  async getUserBalance(): Promise<UserBalance> {
    try {
      const response = await api.get('/balance');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user balance:', error);
      throw error;
    }
  },

  // Get transaction history
  async getTransactionHistory(limit = 50, offset = 0): Promise<BalanceTransaction[]> {
    try {
      const response = await api.get(`/balance/transactions?limit=${limit}&offset=${offset}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  },

  // Top-up balance (placeholder for payment integration)
  async topUpBalance(amount: number) {
    try {
      const response = await api.post('/balance/topup', { amount });
      return response.data;
    } catch (error) {
      console.error('Error topping up balance:', error);
      throw error;
    }
  }
};
