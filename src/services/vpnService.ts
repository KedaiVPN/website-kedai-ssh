import axios from 'axios';
import { AccountData, CreateAccountRequest, Server, VPNProtocol, VPNAccount } from '@/types/vpn';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api/vpn' 
  : '/api/vpn';

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
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch servers');
      }

      return response.data.servers.map((server: any) => ({
        id: server.id.toString(),
        name: server.name,
        domain: server.domain,
        location: server.location,
        auth: server.auth,
        status: server.status === 'active' ? 'online' : 'offline',
        protocols: JSON.parse(server.protocols || '["ssh"]'),
        ping: 0, // Will be calculated separately if needed
        users: 0, // Will be fetched separately if needed
        max_users: server.max_users,
        max_account_creation: server.max_account_creation
      }));
    } catch (error) {
      console.error('Error fetching servers:', error);
      throw error;
    }
  },

  // Get servers by protocol
  async getServersByProtocol(protocol: VPNProtocol): Promise<Server[]> {
    try {
      const response = await api.get(`/servers/${protocol}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch servers');
      }

      return response.data.servers.map((server: any) => ({
        id: server.id.toString(),
        name: server.name,
        domain: server.domain,
        location: server.location,
        auth: server.auth,
        status: server.status === 'online' ? 'offline' : 'maintenance',
        protocols: JSON.parse(server.protocols || '["ssh"]'),
        ping: 0,
        users: 0,
        max_users: server.max_users,
        max_account_creation: server.max_account_creation
      }));
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

      const response = await api.post('/create-account', payload);
      
      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message || '❌ Gagal membuat akun. Silakan coba lagi.'
        };
      }

      // Transform backend response to frontend format
      const accountData: AccountData = {
        username: response.data.account.username,
        domain: response.data.account.domain,
        expired: new Date(response.data.account.expires_at).toLocaleDateString('id-ID'),
        ip_limit: response.data.account.ip_limit?.toString() || '2',
        quota: response.data.account.quota ? `${response.data.account.quota} GB` : undefined
      };

      // Add protocol-specific data
      if (response.data.account.connection_details) {
        const details = response.data.account.connection_details;
        
        if (request.protocol === 'ssh') {
          accountData.password = details.password;
          accountData.ssh_ws_port = details.ports?.ws || '80';
          accountData.ssh_ssl_port = details.ports?.ssl || '443';
        } else {
          accountData.uuid = details.uuid;
          
          if (details.links) {
            Object.assign(accountData, details.links);
          }
        }
      }

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

  // Get user's VPN accounts
  async getUserAccounts(): Promise<VPNAccount[]> {
    try {
      const response = await api.get('/accounts');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch accounts');
      }

      return response.data.accounts.map((account: any) => ({
        id: account.id,
        username: account.username,
        protocol: account.protocol,
        server_name: account.server_name,
        server_domain: account.server_domain,
        expires_at: account.expires_at,
        status: account.status,
        quota: account.quota,
        ip_limit: account.ip_limit,
        created_at: account.created_at,
        connection_details: account.connection_details
      }));
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      throw error;
    }
  },

  // Get specific VPN account
  async getAccount(accountId: string): Promise<VPNAccount> {
    try {
      const response = await api.get(`/accounts/${accountId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch account');
      }

      const account = response.data.account;
      return {
        id: account.id,
        username: account.username,
        protocol: account.protocol,
        server_name: account.server_name,
        server_domain: account.server_domain,
        expires_at: account.expires_at,
        status: account.status,
        quota: account.quota,
        ip_limit: account.ip_limit,
        created_at: account.created_at,
        connection_details: account.connection_details
      };
    } catch (error) {
      console.error('Error fetching account:', error);
      throw error;
    }
  },

  // Extend account expiration
  async extendAccount(accountId: string, days: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.post(`/accounts/${accountId}/extend`, { days });
      
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error extending account:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to extend account'
        };
      }
      
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  },

  // Delete account
  async deleteAccount(accountId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/accounts/${accountId}`);
      
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error) {
      console.error('Error deleting account:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          message: error.response.data?.message || 'Failed to delete account'
        };
      }
      
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
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
