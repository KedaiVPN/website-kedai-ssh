
// Service untuk mengelola API calls terkait VPN
// Berisi fungsi-fungsi untuk berkomunikasi dengan backend VPN

import axios from 'axios';
import { Server, AccountData, CreateAccountRequest, VPNProtocol } from '@/types/vpn';

// Base URL untuk API VPN eksternal
const API_BASE_URL = 'https://kedaivpn.my.id';

// Membuat instance axios dengan konfigurasi default
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // Timeout 10 detik
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor untuk logging request (membantu debugging)
api.interceptors.request.use(
  (config) => {
    console.log('=== VPN API REQUEST ===');
    console.log('Method:', config.method?.toUpperCase());
    console.log('URL:', config.url);
    console.log('Data:', config.data);
    console.log('======================');
    return config;
  },
  (error) => {
    console.error('VPN API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor untuk logging response (membantu debugging)
api.interceptors.response.use(
  (response) => {
    console.log('=== VPN API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    console.log('========================');
    return response;
  },
  (error) => {
    console.error('=== VPN API ERROR ===');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('=====================');
    return Promise.reject(error);
  }
);

// Interface untuk response API yang konsisten
interface ApiResponse<T> {
  success: boolean; // Status keberhasilan
  message: string; // Pesan dari server
  data?: T; // Data yang dikembalikan (opsional)
}

// Object utama yang berisi semua fungsi service VPN
export const vpnService = {
  // Mengambil daftar server yang tersedia
  getServers: async (): Promise<Server[]> => {
    try {
      console.log('🔄 Mengambil daftar server...');
      
      // Data server mock untuk development/demo
      // TODO: Ganti dengan API call ke server sesungguhnya
      const mockServers: Server[] = [
        {
          id: 'sg1',
          name: 'Singapore 1',
          domain: 'sg1.kedaivpn.my.id',
          location: 'Singapore',
          auth: 'sg1-auth-key',
          status: 'online',
          protocols: ['ssh', 'vmess', 'vless', 'trojan'],
          ping: 25,
          users: 45
        },
        {
          id: 'us1',
          name: 'United States 1',
          domain: 'us1.kedaivpn.my.id',
          location: 'United States',
          auth: 'us1-auth-key',
          status: 'online',
          protocols: ['ssh', 'vmess', 'vless'],
          ping: 150,
          users: 32
        },
        {
          id: 'jp1',
          name: 'Japan 1',
          domain: 'jp1.kedaivpn.my.id',
          location: 'Japan',
          auth: 'jp1-auth-key',
          status: 'maintenance',
          protocols: ['ssh', 'trojan'],
          ping: 75,
          users: 0
        }
      ];

      // Simulasi delay network
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Server berhasil diambil:', mockServers);
      return mockServers;
    } catch (error) {
      console.error('❌ Error mengambil server:', error);
      throw error;
    }
  },

  // Membuat akun VPN baru
  createAccount: async (request: CreateAccountRequest): Promise<ApiResponse<AccountData>> => {
    try {
      console.log('🔄 Membuat akun VPN...');
      console.log('📤 Data request:', JSON.stringify(request, null, 2));

      // Validasi input
      if (!request.username || !request.protocol || !request.serverId) {
        throw new Error('Data request tidak lengkap');
      }

      // Simulasi pembuatan akun dengan data mock
      // TODO: Ganti dengan API call sesungguhnya
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulasi delay

      // Generate data akun berdasarkan protocol
      const baseAccountData = {
        username: request.username,
        domain: 'sg1.kedaivpn.my.id', // Seharusnya dari server yang dipilih
        expired: new Date(Date.now() + request.duration * 24 * 60 * 60 * 1000).toISOString(),
        ip_limit: (request.ipLimit || 2).toString(),
        quota: request.quota ? `${request.quota}GB` : undefined
      };

      let accountData: AccountData;

      // Generate data spesifik berdasarkan protocol
      switch (request.protocol) {
        case 'ssh':
          accountData = {
            ...baseAccountData,
            password: request.password || 'generatedPassword123',
            ssh_ws_port: '80',
            ssh_ssl_port: '443'
          };
          break;

        case 'vmess':
          accountData = {
            ...baseAccountData,
            uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            }),
            vmess_tls_link: `vmess://generated-link-tls`,
            vmess_nontls_link: `vmess://generated-link-nontls`,
            vmess_grpc_link: `vmess://generated-link-grpc`
          };
          break;

        case 'vless':
          accountData = {
            ...baseAccountData,
            uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c == 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            }),
            vless_tls_link: `vless://generated-link-tls`,
            vless_nontls_link: `vless://generated-link-nontls`,
            vless_grpc_link: `vless://generated-link-grpc`
          };
          break;

        case 'trojan':
          accountData = {
            ...baseAccountData,
            password: request.password || 'generatedTrojanPassword',
            trojan_tls_link: `trojan://generated-link-tls`,
            trojan_nontls_link1: `trojan://generated-link-nontls`,
            trojan_grpc_link: `trojan://generated-link-grpc`
          };
          break;

        default:
          throw new Error('Protocol tidak didukung');
      }

      const response: ApiResponse<AccountData> = {
        success: true,
        message: `Akun ${request.protocol.toUpperCase()} berhasil dibuat!`,
        data: accountData
      };

      console.log('✅ Akun berhasil dibuat:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Error membuat akun:', error);
      
      // Return error response yang konsisten
      return {
        success: false,
        message: error.message || 'Terjadi kesalahan saat membuat akun'
      };
    }
  },

  // Mengambil informasi akun berdasarkan username dan protocol
  getAccountInfo: async (username: string, protocol: VPNProtocol): Promise<ApiResponse<AccountData>> => {
    try {
      console.log(`🔄 Mengambil info akun ${username} (${protocol})...`);
      
      // TODO: Implementasi API call sesungguhnya
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response
      return {
        success: false,
        message: 'Fitur belum diimplementasi'
      };
    } catch (error: any) {
      console.error('❌ Error mengambil info akun:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengambil informasi akun'
      };
    }
  }
};
