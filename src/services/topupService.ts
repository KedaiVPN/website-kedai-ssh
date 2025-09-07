
interface TopupResponse {
  success: boolean;
  data?: {
    reference: string;
    status: 'pending' | 'success' | 'failed' | 'expired';
    amount: number;
    paymentMethod: string;
    createdAt: string;
    tripayStatus?: any;
    newToken?: string; // New token if role was upgraded
  };
  message: string;
}

interface CreatePaymentRequest {
  amount: number;
  paymentMethod?: string;
  phoneNumber?: string;
}

interface CreatePaymentResponse {
  success: boolean;
  message?: string;
  // For REDIRECT flow
  paymentUrl?: string;
  // For DIRECT flow
  reference?: string;
  qrCodeUrl?: string;
  amountNet?: number;
  amountGross?: number;
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

    // The service should not handle token updates.
    // This will be handled by the component that calls the service.
    return response.json();
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
    
    // The service should not handle token updates.
    // This will be handled by the component that calls the service.
    return response.json();
  }
};

export type { TopupTransaction, CreatePaymentRequest, CreatePaymentResponse, TopupHistoryResponse };
