import { CreatePaymentResponse, TopupHistoryResponse, TopupResponse } from '@/types/vpn';
import { userFetch } from './userFetch';

export type { TopupTransaction, CreatePaymentResponse, TopupHistoryResponse, TopupResponse } from '@/types/vpn';

// Define a base URL for the API.
// In a real-world scenario, this would come from an environment variable.
const API_BASE_URL = window.location.origin;

export const topupService = {
  // Create payment
  async createPayment(request: { amount: number; paymentMethod?: string; phoneNumber?: string; }): Promise<CreatePaymentResponse> {
    const response = await userFetch(`${API_BASE_URL}/api/topup/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(errorData.message);
    }
    return response.json();
  },

  // Get topup history
  async getTopupHistory(limit = 20): Promise<TopupHistoryResponse> {
    const response = await userFetch(`${API_BASE_URL}/api/topup/history?limit=${limit}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
      throw new Error(errorData.message);
    }
    return response.json();
  },

  // Check transaction status
  async getTransactionStatus(reference: string): Promise<TopupResponse> {
    const response = await userFetch(`${API_BASE_URL}/api/topup/status/${reference}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Don't throw here for polling, just return a non-success status
      // so the polling loop can continue on network errors.
      console.error('getTransactionStatus fetch failed, but polling will continue.');
      return { success: false, message: 'Network error during status check.' };
    }
    return response.json();
  }
};
