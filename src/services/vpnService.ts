
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

    // Simulate API call to create account
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response data based on protocol
    const baseData: AccountData = {
      username: request.username,
      domain: server.domain,
      expired: new Date(Date.now() + request.duration * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'),
      ip_limit: request.ipLimit?.toString() || '2',
      quota: request.quota ? `${request.quota} GB` : 'Unlimited'
    };

    let accountData: AccountData;

    switch (request.protocol) {
      case 'ssh':
        accountData = {
          ...baseData,
          password: request.password || 'generated-password',
          ssh_ws_port: '80',
          ssh_ssl_port: '443'
        };
        break;
      
      case 'vmess':
        const vmessUuid = generateUUID();
        accountData = {
          ...baseData,
          uuid: vmessUuid,
          vmess_tls_link: `vmess://base64-encoded-config-tls`,
          vmess_nontls_link: `vmess://base64-encoded-config-nontls`,
          vmess_grpc_link: `vmess://base64-encoded-config-grpc`
        };
        break;
      
      case 'vless':
        const vlessUuid = generateUUID();
        accountData = {
          ...baseData,
          uuid: vlessUuid,
          ns_domain: `ns.${server.domain}`,
          vless_tls_link: `vless://${vlessUuid}@${server.domain}:443?security=tls&type=ws&path=/vless`,
          vless_nontls_link: `vless://${vlessUuid}@${server.domain}:80?type=ws&path=/vless`,
          vless_grpc_link: `vless://${vlessUuid}@${server.domain}:443?security=tls&type=grpc&serviceName=vless-grpc`
        };
        break;
      
      case 'trojan':
        const trojanUuid = generateUUID();
        accountData = {
          ...baseData,
          uuid: trojanUuid,
          trojan_tls_link: `trojan://${trojanUuid}@${server.domain}:443?security=tls&type=ws&path=/trojan-ws`,
          trojan_nontls_link1: `trojan://${trojanUuid}@${server.domain}:80?type=ws&path=/trojan-ws`,
          trojan_grpc_link: `trojan://${trojanUuid}@${server.domain}:443?security=tls&type=grpc&serviceName=trojan-grpc`
        };
        break;
      
      default:
        return {
          success: false,
          message: '❌ Protocol tidak didukung.'
        };
    }

    return {
      success: true,
      data: accountData,
      message: '✅ Akun berhasil dibuat!'
    };
  }
};

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
