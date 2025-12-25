import { userFetch } from './userFetch';

const API_BASE_URL = window.location.origin;

export interface XLPackage {
  id: number;
  package_code: string;
  name: string;
  description: string;
  price: number;
  fee: number;
  is_active?: number;
  payment_method: 'e-wallet' | 'pulsa';
  kategori: 'resmi' | 'tidak resmi';
}

export interface XLActivePackageBenefit {
  name: string;
  information: string;
  quota: string;
  remaining_quota: string;
}

export interface XLActivePackage {
  name: string;
  expired_at: string;
  benefits: XLActivePackageBenefit[];
}

export interface XLTransaction {
  id: number;
  package_name: string;
  phone: string;
  payment_method: string;
  fee: number;
  status: string;
  created_at: string;
  trx_id?: string;
  qr_code?: string;
  deeplink_url?: string;
}

export interface XLScheduledPurchase {
    id: number;
    phone_number: string;
    package_code: string;
    scheduled_date: string; // YYYY-MM-DD
    status: 'active' | 'completed' | 'failed';
    package_name: string;
    fee: number;
}

export const xlService = {
  // Request OTP
  async requestOTP(phone: string) {
    const response = await userFetch(`${API_BASE_URL}/api/xl/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone })
    });
    return response.json();
  },

  // Login with MSISDN
  async loginWithMsisdn(msisdn: string) {
    const response = await userFetch(`${API_BASE_URL}/api/xl/login-msisdn`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ msisdn })
    });
    return response.json();
  },

  // Login with OTP
  async loginOTP(phone: string, authId: string, otp: string) {
    const response = await userFetch(`${API_BASE_URL}/api/xl/login-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, authId, otp })
    });
    return response.json();
  },

  // Get Subscriber Info
  async getSubscriberInfo(accessToken: string) {
    const response = await userFetch(`${API_BASE_URL}/api/xl/quota-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken })
    });
    return response.json();
  },

  // Get Active Packages
  async getActivePackages(accessToken: string): Promise<{ success: boolean; data?: { quotas: XLActivePackage[] }; message?: string }> {
    const response = await userFetch(`${API_BASE_URL}/api/xl/active-packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken })
    });
    return response.json();
  },

  // Get Packages
  async getPackages(): Promise<XLPackage[]> {
    const response = await userFetch(`${API_BASE_URL}/api/xl/packages`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    return result.data || [];
  },

  // Purchase Package
  async purchasePackage(
    packageCode: string, 
    phone: string, 
    accessToken: string, 
    paymentMethod: 'DANA' | 'QRIS' | 'GOPAY' | 'SHOPEEPAY' | 'OVO' | 'BALANCE'
  ) {
    const response = await userFetch(`${API_BASE_URL}/api/xl/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ packageCode, phone, accessToken, paymentMethod })
    });
    return response.json();
  },

  // Get Transactions
  async getTransactions(): Promise<XLTransaction[]> {
    const response = await userFetch(`${API_BASE_URL}/api/xl/transactions`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    return result.data || [];
  },

  // --- Scheduled Purchases ---
  async getAllScheduledPurchases(phone_number: string): Promise<XLScheduledPurchase[]> {
    const response = await userFetch(`${API_BASE_URL}/api/xl/scheduled-purchases?phone_number=${phone_number}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data || [];
  },

  async getScheduledNumbers(): Promise<string[]> {
    const response = await userFetch(`${API_BASE_URL}/api/xl/scheduled-numbers`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data || [];
  },

  async createScheduledPurchases(phone_number: string, package_code: string, scheduled_dates: string[]) {
    const response = await userFetch(`${API_BASE_URL}/api/xl/scheduled-purchases`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone_number, package_code, scheduled_dates })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal membuat jadwal.');
    return result;
  },

  async cancelScheduledPurchase(scheduleId: number) {
      const response = await userFetch(`${API_BASE_URL}/api/xl/scheduled-purchases/${scheduleId}`, {
          method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal membatalkan jadwal.');
      return result;
  },

  // Retry a failed scheduled purchase
  async retryScheduledPurchase(scheduleId: number) {
      const response = await userFetch(`${API_BASE_URL}/api/xl/scheduled-purchases/${scheduleId}/retry`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          }
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Gagal mengulangi pembelian.');
      return result;
  },


  // Admin: Get all packages
  async adminGetPackages(): Promise<XLPackage[]> {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/admin/packages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    return result.data || [];
  },

  // Admin: Add package
  async adminAddPackage(packageData: Partial<XLPackage>) {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/admin/packages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(packageData)
    });
    return response.json();
  },

  // Admin: Update package
  async adminUpdatePackage(id: number, packageData: Partial<XLPackage>) {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/admin/packages/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(packageData)
    });
    return response.json();
  },

  // Admin: Delete package
  async adminDeletePackage(id: number) {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/admin/packages/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return response.json();
  },

  // Admin: Get external packages
  async adminGetExternalPackages(): Promise<any> {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/admin/external-packages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.json();
  },

  // Admin: Sync packages
  async adminSyncPackages(packages: Partial<XLPackage>[]): Promise<any> {
    const token = localStorage.getItem('admin_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/admin/sync-packages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ packages }),
    });
    return response.json();
  }
};
