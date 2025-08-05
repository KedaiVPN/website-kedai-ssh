import axios from 'axios';

interface ServerData {
  id: number;
  domain: string;
  auth: string;
  nama_server: string;
  location?: string;
  protocols?: string;
  status?: 'online' | 'offline' | 'maintenance';
  quota?: number;
  iplimit?: number;
  batas_create_akun?: number;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  balance: number;
  is_locked: boolean;
  created_at: string;
  transaction_count: number;
}

interface TransactionData {
  id: number;
  user_id: number;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  reference_type: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

interface AddServerRequest {
  domain: string;
  auth: string;
  nama_server: string;
  location: string;
  protocols: string;
  status: 'online' | 'offline' | 'maintenance';
  quota: number;
  iplimit: number;
  batas_create_akun: number;
}

interface UpdateServerRequest {
  domain: string;
  auth: string;
  nama_server: string;
  location: string;
  protocols: string;
  status: 'online' | 'offline' | 'maintenance';
  quota: number;
  iplimit: number;
  batas_create_akun: number;
}

// Buat axios instance khusus untuk admin API
const adminApi = axios.create({
  baseURL: '/api/admin', // Menggunakan proxy Vite untuk development
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor untuk logging
adminApi.interceptors.request.use(
  (config) => {
    console.log('=== ADMIN API REQUEST ===');
    console.log('Method:', config.method?.toUpperCase());
    console.log('URL:', config.url);
    console.log('Base URL:', config.baseURL);
    console.log('Full URL:', `${config.baseURL}${config.url}`);
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    console.log('========================');
    return config;
  },
  (error) => {
    console.error('Admin API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor untuk logging
adminApi.interceptors.response.use(
  (response) => {
    console.log('=== ADMIN API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('URL:', response.config.url);
    console.log('Data:', response.data);
    console.log('=========================');
    return response;
  },
  (error) => {
    console.error('=== ADMIN API ERROR ===');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Error Message:', error.message);
    console.error('Response Data:', error.response?.data);
    console.error('======================');
    return Promise.reject(error);
  }
);

export const adminService = {
  // Get all servers
  getServers: async (): Promise<ServerData[]> => {
    try {
      console.log('🔄 Fetching servers...');
      const response = await adminApi.get('/servers');
      console.log('✅ Servers fetched successfully:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('❌ Error fetching servers:', error);
      throw error;
    }
  },

  // Add new server
  addServer: async (serverData: AddServerRequest): Promise<ServerData> => {
    try {
      console.log('🔄 Adding server...');
      console.log('📤 Server data to send:', JSON.stringify(serverData, null, 2));
      
      // Validate data sebelum dikirim
      if (!serverData.domain || !serverData.auth || !serverData.nama_server || 
          !serverData.location || !serverData.protocols || !serverData.status || 
          !serverData.quota || !serverData.iplimit || !serverData.batas_create_akun) {
        throw new Error('Semua field (domain, auth, nama_server, location, protocols, status, quota, iplimit, batas_create_akun) wajib diisi');
      }

      const response = await adminApi.post('/servers', serverData);
      console.log('✅ Server added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error adding server:', error);
      
      // Log tambahan untuk debugging
      if (error.response) {
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Headers:', error.response.headers);
        console.error('Error Response Data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Request setup error:', error.message);
      }
      
      throw error;
    }
  },

  // Update server
  updateServer: async (id: number, serverData: UpdateServerRequest): Promise<ServerData> => {
    try {
      console.log('🔄 Updating server with ID:', id);
      console.log('📤 Server data to update:', JSON.stringify(serverData, null, 2));
      
      // Validate data sebelum dikirim
      if (!serverData.domain || !serverData.auth || !serverData.nama_server || 
          !serverData.location || !serverData.protocols || !serverData.status || 
          !serverData.quota || !serverData.iplimit || !serverData.batas_create_akun) {
        throw new Error('Semua field (domain, auth, nama_server, location, protocols, status, quota, iplimit, batas_create_akun) wajib diisi');
      }

      const response = await adminApi.put(`/servers/${id}`, serverData);
      console.log('✅ Server updated successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error updating server:', error);
      
      // Log tambahan untuk debugging
      if (error.response) {
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Headers:', error.response.headers);
        console.error('Error Response Data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Request setup error:', error.message);
      }
      
      throw error;
    }
  },

  // Delete server
  deleteServer: async (id: number): Promise<void> => {
    try {
      console.log('🔄 Deleting server with ID:', id);
      await adminApi.delete(`/servers/${id}`);
      console.log('✅ Server deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting server:', error);
      throw error;
    }
  },

  // User Management Methods
  getUsers: async (): Promise<UserData[]> => {
    try {
      console.log('🔄 Fetching users...');
      const response = await adminApi.get('/users');
      console.log('✅ Users fetched successfully:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  },

  addUserBalance: async (userId: number, amount: number, description: string) => {
    try {
      console.log('🔄 Adding balance to user:', userId, amount);
      const response = await adminApi.post(`/users/${userId}/add-balance`, {
        amount,
        description
      });
      console.log('✅ Balance added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error adding balance:', error);
      throw error;
    }
  },

  deductUserBalance: async (userId: number, amount: number, description: string) => {
    try {
      console.log('🔄 Deducting balance from user:', userId, amount);
      const response = await adminApi.post(`/users/${userId}/deduct-balance`, {
        amount,
        description
      });
      console.log('✅ Balance deducted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error deducting balance:', error);
      throw error;
    }
  },

  lockUser: async (userId: number) => {
    try {
      console.log('🔄 Locking user:', userId);
      const response = await adminApi.post(`/users/${userId}/lock`);
      console.log('✅ User locked successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error locking user:', error);
      throw error;
    }
  },

  unlockUser: async (userId: number) => {
    try {
      console.log('🔄 Unlocking user:', userId);
      const response = await adminApi.post(`/users/${userId}/unlock`);
      console.log('✅ User unlocked successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error unlocking user:', error);
      throw error;
    }
  },

  getUserTransactions: async (userId: number, limit = 20): Promise<TransactionData[]> => {
    try {
      console.log('🔄 Fetching user transactions:', userId);
      const response = await adminApi.get(`/users/${userId}/transactions?limit=${limit}`);
      console.log('✅ Transactions fetched successfully:', response.data);
      return response.data || [];
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
      throw error;
    }
  }
};
