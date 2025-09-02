
interface TopupResponse {
  success: boolean;
  data?: any;
  message: string;
}

interface CreatePaymentRequest {
  amount: number;
  paymentMethod?: string;
  phoneNumber?: string;
}

interface CreatePaymentResponse {
  success: boolean;
  data?: {
    paymentUrl: string;
    reference: string;
    merchantRef: string;
    amount: number;
  };
  message: string;
}

interface TopupHistoryResponse {
  success: boolean;
  data?: TopupTransaction[];
  message: string;
}

interface TopupTransaction {
  id: number;
  user_id: number;
  amount: number;
  duitku_reference: string; // Still using existing column names for compatibility
  duitku_merchant_order_id: string;
  payment_method: string;
  status: 'pending' | 'success' | 'failed' | 'expired';
  created_at: string;
  updated_at: string;
}

export const topupService = {
  // Create payment
  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/topup/create-payment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...request,
        paymentMethod: request.paymentMethod || 'QRIS' // Default to QRIS for Tripay
      })
    });

    const result = await response.json();
    
    // Handle token update if role was upgraded during topup
    if (result.newToken) {
      localStorage.setItem('auth_token', result.newToken);
      // Trigger auth context refresh
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'auth_token',
        newValue: result.newToken,
        storageArea: localStorage
      }));
    }

    return result;
  },

  // Get topup history
  async getTopupHistory(limit = 20): Promise<TopupHistoryResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`/api/topup/history?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  },

  // Check transaction status
  async getTransactionStatus(reference: string): Promise<TopupResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`/api/topup/status/${reference}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }
};

export type { TopupTransaction, CreatePaymentRequest, CreatePaymentResponse, TopupHistoryResponse };
