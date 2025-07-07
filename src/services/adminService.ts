
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
    console.log('Admin API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      data: config.data
    });
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
    console.log('Admin API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Admin API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export const adminService = {
  // Get all servers
  getServers: async (): Promise<ServerData[]> => {
    try {
      const response = await adminApi.get('/servers');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching servers:', error);
      throw error;
    }
  },

  // Add new server
  addServer: async (serverData: AddServerRequest): Promise<ServerData> => {
    try {
      console.log('Adding server with data:', serverData);
      const response = await adminApi.post('/servers', serverData);
      console.log('Server added successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding server:', error);
      throw error;
    }
  },

  // Delete server
  deleteServer: async (id: number): Promise<void> => {
    try {
      console.log('Deleting server with ID:', id);
      await adminApi.delete(`/servers/${id}`);
      console.log('Server deleted successfully');
    } catch (error) {
      console.error('Error deleting server:', error);
      throw error;
    }
  }
};
