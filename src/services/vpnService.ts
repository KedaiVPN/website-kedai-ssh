import axios from 'axios';
import { AccountData, CreateAccountRequest, Server, VPNProtocol } from '@/types/vpn';

// Mock servers data - in real app this would come from your backend
const MOCK_SERVERS: Server[] = [
  {
    id: '1',
    name: 'Singapore',
    domain: 'bansos.kedaivpn.my.id',
    location: 'Singapore',
    auth: '6a9cb6',
    status: 'online'
  },
  {
    id: '2',
    name: 'Japan Premium',
    domain: 'jp1.yourvpn.com',
    location: 'Japan',
    auth: 'your-auth-key',
    status: 'online'
  },
  {
    id: '3',
    name: 'USA Premium',
    domain: 'us1.yourvpn.com',
    location: 'United States',
    auth: 'your-auth-key',
    status: 'maintenance'
  }
];

// Individual API functions as requested (keeping for compatibility)
export async function createSSH(user: string, password: string, exp: number, iplimit: number) {
  const response = await fetch(`http://localhost:5888/createssh?user=${user}&password=${password}&exp=${exp}&iplimit=${iplimit}&auth=your-auth-key`);
  return response.json();
}

export async function createVMess(user: string, exp: number, iplimit: number, quota: number) {
  const response = await fetch(`http://localhost:5888/createvmess?user=${user}&exp=${exp}&iplimit=${iplimit}&quota=${quota}&auth=your-auth-key`);
  return response.json();
}

export async function createVLess(user: string, exp: number, iplimit: number, quota: number) {
  const response = await fetch(`http://localhost:5888/createvless?user=${user}&exp=${exp}&iplimit=${iplimit}&quota=${quota}&auth=your-auth-key`);
  return response.json();
}

export async function createTrojan(user: string, exp: number, iplimit: number, quota: number) {
  const response = await fetch(`http://localhost:5888/createtrojan?user=${user}&exp=${exp}&iplimit=${iplimit}&quota=${quota}&auth=your-auth-key`);
  return response.json();
}

// Keep existing vpnService object for compatibility
export const vpnService = {
  getServers: async (): Promise<Server[]> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return MOCK_SERVERS;
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

    const server = MOCK_SERVERS.find(s => s.id === request.serverId);
    if (!server) {
      return {
        success: false,
        message: '❌ Server tidak ditemukan. Silakan coba lagi.'
      };
    }

    if (server.status !== 'online') {
      return {
        success: false,
        message: '❌ Server sedang maintenance. Silakan pilih server lain.'
      };
    }

    if (!server.auth) {
      return {
        success: false,
        message: '❌ Auth key tidak dikonfigurasi untuk server ini.'
      };
    }

    try {
      // Build the API URL based on protocol
      const baseUrl = `http://${server.domain}:5888`;
      let endpoint = '';
      let params: Record<string, string> = {
        user: request.username,
        exp: request.duration.toString(),
        iplimit: (request.ipLimit || 2).toString(),
        auth: server.auth
      };

      // Set endpoint and add protocol-specific parameters
      switch (request.protocol) {
        case 'ssh':
          endpoint = '/createssh';
          if (!request.password) {
            return {
              success: false,
              message: '❌ Password diperlukan untuk SSH protocol.'
            };
          }
          params.password = request.password;
          break;
        
        case 'vmess':
          endpoint = '/createvmess';
          params.quota = (request.quota || 100).toString();
          break;
        
        case 'vless':
          endpoint = '/createvless';
          params.quota = (request.quota || 100).toString();
          break;
        
        case 'trojan':
          endpoint = '/createtrojan';
          params.quota = (request.quota || 100).toString();
          break;
        
        default:
          return {
            success: false,
            message: '❌ Protocol tidak didukung.'
          };
      }

      const apiUrl = `${baseUrl}${endpoint}`;
      console.log('Making API request to:', apiUrl);
      console.log('With parameters:', params);

      // Make the API call using axios
      const response = await axios.get(apiUrl, { params });
      const result = response.data;

      console.log('API response:', result);

      if (result.status === 'success' && result.data) {
        // Transform backend response to match frontend AccountData interface
        const accountData: AccountData = {
          username: result.data.username || request.username,
          domain: result.data.domain || server.domain,
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
            accountData.ns_domain = result.data.ns_domain || `ns.${server.domain}`;
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
        if (error.code === 'ECONNREFUSED') {
          return {
            success: false,
            message: '❌ Tidak dapat terhubung ke server. Pastikan server aktif.'
          };
        } else if (error.response) {
          return {
            success: false,
            message: `❌ Server error: ${error.response.status} - ${error.response.statusText}`
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
