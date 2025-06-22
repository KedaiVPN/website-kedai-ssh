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

// Environment variables configuration
const BASE_URL = import.meta.env.VITE_VPS_API_URL || 'http://localhost:5888';
const AUTH_KEY = import.meta.env.VITE_AUTH_KEY;

// Individual API functions as requested
export async function createSSH(user: string, password: string, exp: number, iplimit: number) {
  const response = await fetch(`${BASE_URL}/createssh?user=${user}&password=${password}&exp=${exp}&iplimit=${iplimit}&auth=${AUTH_KEY}`);
  return response.json();
}

export async function createVMess(user: string, exp: number, iplimit: number, quota: number) {
  const response = await fetch(`${BASE_URL}/createvmess?user=${user}&exp=${exp}&iplimit=${iplimit}&quota=${quota}&auth=${AUTH_KEY}`);
  return response.json();
}

export async function createVLess(user: string, exp: number, iplimit: number, quota: number) {
  const response = await fetch(`${BASE_URL}/createvless?user=${user}&exp=${exp}&iplimit=${iplimit}&quota=${quota}&auth=${AUTH_KEY}`);
  return response.json();
}

export async function createTrojan(user: string, exp: number, iplimit: number, quota: number) {
  const response = await fetch(`${BASE_URL}/createtrojan?user=${user}&exp=${exp}&iplimit=${iplimit}&quota=${quota}&auth=${AUTH_KEY}`);
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

    if (!AUTH_KEY) {
      return {
        success: false,
        message: '❌ AUTH_KEY tidak dikonfigurasi. Silakan hubungi administrator.'
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

    try {
      let result;
      
      // Call the appropriate function based on protocol
      switch (request.protocol) {
        case 'ssh':
          if (!request.password) {
            return {
              success: false,
              message: '❌ Password diperlukan untuk SSH protocol.'
            };
          }
          result = await createSSH(request.username, request.password, request.duration, request.ipLimit || 2);
          break;
        
        case 'vmess':
          result = await createVMess(request.username, request.duration, request.ipLimit || 2, request.quota || 100);
          break;
        
        case 'vless':
          result = await createVLess(request.username, request.duration, request.ipLimit || 2, request.quota || 100);
          break;
        
        case 'trojan':
          result = await createTrojan(request.username, request.duration, request.ipLimit || 2, request.quota || 100);
          break;
        
        default:
          return {
            success: false,
            message: '❌ Protocol tidak didukung.'
          };
      }

      console.log('Backend response:', result);

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
          accountData.ssh_ws_port = '80';
          accountData.ssh_ssl_port = '443';
        } else {
          accountData.uuid = result.data.uuid;
          
          if (request.protocol === 'vmess') {
            accountData.vmess_tls_link = result.data.vmess_tls_link;
            accountData.vmess_nontls_link = result.data.vmess_nontls_link;
            accountData.vmess_grpc_link = result.data.vmess_grpc_link;
          } else if (request.protocol === 'vless') {
            accountData.ns_domain = `ns.${server.domain}`;
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
      return {
        success: false,
        message: '❌ Terjadi kesalahan koneksi. Periksa koneksi internet Anda.'
      };
    }
  }
};
