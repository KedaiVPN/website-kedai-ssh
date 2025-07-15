
// Service untuk mengelola API calls terkait administrasi server
// Berisi fungsi-fungsi untuk CRUD operasi server oleh admin

import axios from 'axios';

// Interface untuk data server dalam sistem admin
interface ServerData {
  id: number; // ID numerik server
  domain: string; // Domain server
  auth: string; // Kunci autentikasi server
  nama_server: string; // Nama server
}

// Interface untuk request menambah server baru
interface AddServerRequest {
  domain: string; // Domain server yang akan ditambahkan
  auth: string; // Kunci autentikasi untuk server
  nama_server: string; // Nama yang akan diberikan ke server
}

// Membuat instance axios khusus untuk admin API
const adminApi = axios.create({
  baseURL: '/api/admin', // Menggunakan proxy Vite untuk development
  timeout: 10000, // Timeout 10 detik
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor untuk logging request admin (membantu debugging dan audit)
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

// Interceptor untuk logging response admin (membantu debugging dan audit)
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

// Object utama yang berisi semua fungsi service admin
export const adminService = {
  // Mengambil semua server yang terdaftar dalam sistem
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

  // Menambahkan server baru ke dalam sistem
  addServer: async (serverData: AddServerRequest): Promise<ServerData> => {
    try {
      console.log('🔄 Adding server...');
      console.log('📤 Server data to send:', JSON.stringify(serverData, null, 2));
      
      // Validasi data sebelum dikirim ke server
      if (!serverData.domain || !serverData.auth || !serverData.nama_server) {
        throw new Error('Semua field (domain, auth, nama_server) wajib diisi');
      }

      const response = await adminApi.post('/servers', serverData);
      console.log('✅ Server added successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error adding server:', error);
      
      // Log tambahan untuk debugging yang lebih detail
      if (error.response) {
        // Server memberikan response error
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Headers:', error.response.headers);
        console.error('Error Response Data:', error.response.data);
      } else if (error.request) {
        // Request dibuat tapi tidak ada response
        console.error('No response received:', error.request);
      } else {
        // Error terjadi saat setup request
        console.error('Request setup error:', error.message);
      }
      
      throw error;
    }
  },

  // Menghapus server dari sistem berdasarkan ID
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
