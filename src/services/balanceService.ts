
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

export interface PublicTransactionLog {
  id: number;
  user_id: number;
  username: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference_type: string;
  reference_id: number | null;
  phone_number: string | null;
  package_name: string | null;
  server_name: string | null;
  ip_limit: number | null;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

interface PublicLogResponse {
  success: boolean;
  data?: PublicTransactionLog[];
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
  },

  // Get public transaction log
  async getPublicTransactionLog(filter: string = 'this_month', myOnly: boolean = false): Promise<PublicLogResponse> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch(`/api/balance/public-log?filter=${filter}&myOnly=${myOnly}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }
};
