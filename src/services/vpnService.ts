import axios from 'axios';
import { AccountData, CreateAccountRequest, Server, VPNProtocol, VPNAccount } from '@/types/vpn';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api' 
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/register';
    }
    return Promise.reject(error);
  }
);

export const vpnService = {
  // Get all available servers
  async getServers(): Promise<Server[]> {
    try {
      const response = await api.get('/servers');
      
      // Direct response from backend - no wrapper
      return response.data.map((server: any) => ({
        id: server.id.toString(),
        name: server.name,
        domain: server.domain,
        location: server.location,
        auth: server.auth,
        status: server.status || 'online',
        protocols: server.protocols || ['ssh', 'vmess', 'vless', 'trojan'],
        ping: server.ping || 0,
        users: server.users || 0,
        max_users: server.max_users,
        max_account_creation: server.batas_create_akun
      }));
    } catch (error) {
      console.error('Error fetching servers:', error);
      throw error;
    }
  },

  // Get servers by protocol
  async getServersByProtocol(protocol: VPNProtocol): Promise<Server[]> {
    try {
      const allServers = await this.getServers();
      return allServers.filter(server => server.protocols.includes(protocol));
    } catch (error) {
      console.error('Error fetching servers by protocol:', error);
      throw error;
    }
  },

  // Create VPN account
  async createAccount(request: CreateAccountRequest): Promise<{ success: boolean; data?: AccountData; message: string }> {
    try {
      if (!this.validateUsername(request.username)) {
        return {
          success: false,
          message: '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.'
        };
      }

      const payload = {
        username: request.username,
        password: request.password,
        protocol: request.protocol,
        duration: request.duration,
        quota: request.quota,
        ipLimit: request.ipLimit,
        serverId: request.serverId
      };

      const response = await api.post('/create', payload);
      
      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message || '❌ Gagal membuat akun. Silakan coba lagi.'
        };
      }

      // Transform backend response to frontend format
      const accountData: AccountData = response.data.data;

      return {
        success: true,
        data: accountData,
        message: response.data.message || '✅ Akun berhasil dibuat!'
      };
    } catch (error) {
      console.error('Error creating account:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          return {
            success: false,
            message: '❌ Tidak dapat terhubung ke server backend. Pastikan server aktif.'
          };
        } else if (error.response) {
          const errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
          return {
            success: false,
            message: `❌ ${errorMessage}`
          };
        }
      }
      
      return {
        success: false,
        message: '❌ Terjadi kesalahan koneksi. Periksa koneksi internet Anda.'
      };
    }
  },

  // Note: User account management is not implemented in this simplified backend
  // These methods are stubs for compatibility
  async getUserAccounts(): Promise<VPNAccount[]> {
    return [];
  },

  async getAccount(accountId: string): Promise<VPNAccount> {
    throw new Error('Account management not available in simplified backend');
  },

  async extendAccount(accountId: string, days: number): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Account management not available in simplified backend'
    };
  },

  async deleteAccount(accountId: string): Promise<{ success: boolean; message: string }> {
    return {
      success: false,
      message: 'Account management not available in simplified backend'
    };
  },

  // Validate username
  validateUsername: (username: string): boolean => {
    return !/\s/.test(username) && /^[a-zA-Z0-9]+$/.test(username);
  }
};

// Legacy functions for backward compatibility (deprecated)
export async function createSSH(user: string, password: string, exp: number, iplimit: number) {
  console.warn('createSSH function is deprecated. Use vpnService.createAccount instead.');
  return { deprecated: true };
}

export async function createVMess(user: string, exp: number, iplimit: number, quota: number) {
  console.warn('createVMess function is deprecated. Use vpnService.createAccount instead.');
  return { deprecated: true };
}

export async function createVLess(user: string, exp: number, iplimit: number, quota: number) {
  console.warn('createVLess function is deprecated. Use vpnService.createAccount instead.');
  return { deprecated: true };
}

export async function createTrojan(user: string, exp: number, iplimit: number, quota: number) {
  console.warn('createTrojan function is deprecated. Use vpnService.createAccount instead.');
  return { deprecated: true };
}
