
interface BalanceResponse {
  success: boolean;
  balance?: number;
  totalAccounts?: number;
  message: string;
}

interface TransactionHistoryResponse {
  success: boolean;
  data?: any[];
  message: string;
}

interface CalculateCostResponse {
  success: boolean;
  data?: {
    ipLimit: number;
    duration: number;
    dailyPrice: number;
    totalCost: number;
    breakdown: string;
    userRole?: 'member' | 'reseller';
  };
  message: string;
}

export const balanceService = {
  // Get user balance
  async getBalance(): Promise<BalanceResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/balance', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  },

  // Get transaction history
  async getTransactionHistory(limit = 50): Promise<TransactionHistoryResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`/api/balance/transactions?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  },

  // Calculate account cost
  async calculateCost(ipLimit: number, duration: number, serverId?: number | string): Promise<CalculateCostResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/balance/calculate-cost', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ipLimit, duration, serverId })
    });

    return response.json();
  }
};
