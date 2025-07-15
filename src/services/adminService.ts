
import axios from 'axios';

interface ServerData {
  id: number;
  domain: string;
  auth: string;
  nama_server: string;
}

interface AddServerRequest {
  domain: string;
  auth: string;
  nama_server: string;
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
      if (!serverData.domain || !serverData.auth || !serverData.nama_server) {
        throw new Error('Semua field (domain, auth, nama_server) wajib diisi');
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
  }
};
