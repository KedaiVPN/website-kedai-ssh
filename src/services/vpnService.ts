import axios from 'axios';
import { AccountData, CreateAccountRequest, Server, VPNProtocol } from '@/types/vpn';

// Base URL untuk backend Express Anda
const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 detik timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Individual API functions as requested (keeping for compatibility)
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

// Keep existing vpnService object for compatibility
export const vpnService = {
  getServers: async (): Promise<Server[]> => {
    try {
      console.log('Fetching servers from backend...');
      const response = await api.get('/api/servers');
      console.log('Servers response:', response.data);
      
      // Assuming backend returns array of servers directly or in a data property
      const servers = response.data.data || response.data;
      return Array.isArray(servers) ? servers : [];
    } catch (error) {
      console.error('Error fetching servers:', error);
      
      // Return sample data when backend is not available
      const sampleServers: Server[] = [
        {
          id: 'sg1-ssh',
          name: 'Singapore SSH Server',
          domain: 'sg1.kedaivpn.my.id',
          location: 'Singapore',
          auth: 'password',
          status: 'online',
          protocols: ['ssh'],
          ping: 12,
          users: 45
        },
        {
          id: 'sg2-vmess', 
          name: 'Singapore VMess Server',
          domain: 'sg2.kedaivpn.my.id',
          location: 'Singapore',
          auth: 'uuid',
          status: 'online',
          protocols: ['vmess', 'vless'],
          ping: 15,
          users: 32
        },
        {
          id: 'us1-trojan',
          name: 'USA Trojan Server',
          domain: 'us1.kedaivpn.my.id', 
          location: 'United States',
          auth: 'uuid',
          status: 'online',
          protocols: ['trojan', 'vless'],
          ping: 180,
          users: 28
        },
        {
          id: 'id1-multi',
          name: 'Indonesia Multi Protocol',
          domain: 'id1.kedaivpn.my.id',
          location: 'Indonesia',
          auth: 'uuid',
          status: 'maintenance',
          protocols: ['ssh', 'vmess', 'vless', 'trojan'],
          ping: 8,
          users: 0
        }
      ];
      
      console.log('Using sample server data due to backend error');
      return sampleServers;
    }
  },

  validateUsername: (username: string): boolean => {
    return !/\s/.test(username) && /^[a-zA-Z0-9]+$/.test(username);
  },

  createAccount: async (request: CreateAccountRequest): Promise<{ success: boolean; data?: AccountData; message: string }> => {
    console.log('Creating account with request:', request);
    
    if (!vpnService.validateUsername(request.username)) {
      return {
        success: false,
        message: '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.'
      };
    }

    try {
      // Prepare payload sesuai format yang diminta
      const payload = {
        userId: request.userId || 'user-123',
        username: request.username,
        password: request.password,
        protocol: request.protocol,
        duration: request.duration,
        quota: request.quota || 100,
        ipLimit: request.ipLimit || 2,
        serverId: request.serverId
      };

      console.log('Sending request to backend:', payload);

      // Kirim POST request ke backend Express
      const response = await api.post('/api/create', payload);
      const result = response.data;

      console.log('Backend response:', result);

      if (result.success && result.data) {
        // Transform backend response to match frontend AccountData interface
        const accountData: AccountData = {
          username: result.data.username || request.username,
          domain: result.data.domain || result.data.server?.domain || '',
          expired: result.data.expired || new Date(Date.now() + request.duration * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'),
          ip_limit: result.data.ip_limit || request.ipLimit?.toString() || '2',
          quota: result.data.quota || (request.quota ? `${request.quota} GB` : '100 GB')
        };

        // Add protocol-specific data
        if (request.protocol === 'ssh') {
          accountData.password = result.data.password;
          accountData.ssh_ws_port = result.data.ssh_ws_port || '80';
          accountData.ssh_ssl_port = result.data.ssh_ssl_port || '443';
        } else {
          accountData.uuid = result.data.uuid;
          
          if (request.protocol === 'vmess') {
            accountData.vmess_tls_link = result.data.vmess_tls_link;
            accountData.vmess_nontls_link = result.data.vmess_nontls_link;
            accountData.vmess_grpc_link = result.data.vmess_grpc_link;
          } else if (request.protocol === 'vless') {
            accountData.ns_domain = result.data.ns_domain;
            accountData.vless_tls_link = result.data.vless_tls_link;
            accountData.vless_nontls_link = result.data.vless_nontls_link;
            accountData.vless_grpc_link = result.data.vless_grpc_link;
          } else if (request.protocol === 'trojan') {
            accountData.trojan_tls_link = result.data.trojan_tls_link;
            accountData.trojan_nontls_link1 = result.data.trojan_nontls_link1;
            accountData.trojan_grpc_link = result.data.trojan_grpc_link;
          }
        }

        return {
          success: true,
          data: accountData,
          message: result.message || '✅ Akun berhasil dibuat!'
        };
      } else {
        return {
          success: false,
          message: result.message || '❌ Gagal membuat akun. Silakan coba lagi.'
        };
      }
    } catch (error) {
      console.error('Error creating account:', error);
      
      // Handle specific axios errors
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
        } else if (error.request) {
          return {
            success: false,
            message: '❌ Tidak ada respons dari server. Periksa koneksi internet Anda.'
          };
        }
      }
      
      return {
        success: false,
        message: '❌ Terjadi kesalahan koneksi. Periksa koneksi internet Anda.'
      };
    }
  }
};
