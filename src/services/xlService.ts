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

export const xlService = {
  // Request OTP
  async requestOTP(phone: string) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/request-otp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone })
    });
    return response.json();
  },

  // Login with MSISDN
  async loginWithMsisdn(msisdn: string) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/login-msisdn`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ msisdn })
    });
    return response.json();
  },

  // Login with OTP
  async loginOTP(phone: string, authId: string, otp: string) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/login-otp`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, authId, otp })
    });
    return response.json();
  },

  // Get Quota Details
  async getQuotaDetails(accessToken: string) {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/quota-details`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ accessToken })
    });
    return response.json();
  },

  // Get Packages
  async getPackages(): Promise<XLPackage[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/packages`, {
      headers: {
        'Authorization': `Bearer ${token}`,
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
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/purchase`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ packageCode, phone, accessToken, paymentMethod })
    });
    return response.json();
  },

  // Get Transactions
  async getTransactions(): Promise<XLTransaction[]> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/api/xl/transactions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const result = await response.json();
    return result.data || [];
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
