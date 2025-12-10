const API_BASE = '/api/digiflazz';

export interface DigiflazzProduct {
  id: number;
  buyer_sku_code: string;
  product_name: string;
  category: string;
  brand: string;
  type: string | null;
  price: number;
  seller_price: number | null;
  selling_price: number;
  is_active: boolean;
  stock: number;
  unlimited_stock: boolean;
  description: string | null;
  product_image_url?: string;
  brand_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DigiflazzCategory {
  category: string;
  product_count: number;
}

export interface DigiflazzBrand {
  brand: string;
  category: string;
  product_count: number;
  image_url?: string; // Add optional image_url
}

export interface GameTopupTransaction {
  id: number;
  user_id: number;
  product_sku: string;
  product_name: string;
  customer_no: string;
  ref_id: string;
  digiflazz_status: 'Pending' | 'Sukses' | 'Gagal';
  price: number;
  selling_price: number;
  sn: string | null;
  message: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
  email?: string;
}

export interface TopupResult {
  success: boolean;
  transaction_id?: number;
  ref_id?: string;
  status?: string;
  sn?: string | null;
  message: string;
  product_name?: string;
  customer_no?: string;
  amount?: number;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  new: number;
  updated: number;
  message: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const getAdminHeaders = () => {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const digiflazzService = {
  // ==================== USER ENDPOINTS ====================

  async getCategories(): Promise<DigiflazzCategory[]> {
    const response = await fetch(`${API_BASE}/categories`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getBrands(category?: string): Promise<DigiflazzBrand[]> {
    const params = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await fetch(`${API_BASE}/brands${params}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async getProducts(category?: string, brand?: string): Promise<DigiflazzProduct[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (brand) params.append('brand', brand);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE}/products${queryString}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async createTopup(buyerSkuCode: string, customerNo: string): Promise<TopupResult> {
    const response = await fetch(`${API_BASE}/topup`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        buyer_sku_code: buyerSkuCode,
        customer_no: customerNo
      })
    });
    const data = await response.json();
    return data;
  },

  async getHistory(limit?: number): Promise<GameTopupTransaction[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await fetch(`${API_BASE}/history${params}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  // ==================== ADMIN ENDPOINTS ====================

  async syncProducts(): Promise<SyncResult> {
    const response = await fetch(`${API_BASE}/admin/sync`, {
      method: 'POST',
      headers: getAdminHeaders()
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data;
  },

  async getAdminProducts(category?: string, brand?: string): Promise<DigiflazzProduct[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (brand) params.append('brand', brand);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE}/admin/products${queryString}`, {
      headers: getAdminHeaders()
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },

  async updateProduct(sku: string, updates: { is_active?: boolean; selling_price?: number }): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE}/admin/products/${encodeURIComponent(sku)}`, {
      method: 'PUT',
      headers: getAdminHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    return data;
  },

  async getAdminTransactions(limit?: number, status?: string): Promise<GameTopupTransaction[]> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (status) params.append('status', status);
    
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE}/admin/transactions${queryString}`, {
      headers: getAdminHeaders()
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  }
};
