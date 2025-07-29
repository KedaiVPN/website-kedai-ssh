import { supabase } from '@/integrations/supabase/client';
import axios from 'axios';
import { Server, CreateAccountRequest, AccountData, VPNProtocol } from '@/types/vpn';

// Keep the external SQLite API endpoints as they are
const SQLITE_API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3001/api' 
  : '/api';

export interface VPNAccount {
  id: string;
  username: string;
  protocol: string;
  server_id: number;
  duration: number;
  quota: number;
  ip_limit: number;
  created_at: string;
}

class SupabaseVPNService {
  // Get all servers from SQLite API (unchanged)
  async getServers(): Promise<Server[]> {
    try {
      const response = await axios.get(`${SQLITE_API_BASE}/servers`);
      return response.data.map((server: any) => ({
        id: server.id.toString(),
        name: server.nama_server,
        domain: server.domain,
        location: server.location || "Unknown",
        auth: server.auth,
        status: server.status || "online",
        protocols: server.protocols ? server.protocols.split(",") as VPNProtocol[] : ["ssh", "vmess", "vless", "trojan"] as VPNProtocol[],
        ping: server.ping || 0,
        users: server.users || 0,
        quota: server.quota,
        iplimit: server.iplimit,
        batas_create_akun: server.batas_create_akun,
        total_create_akun: server.total_create_akun
      }));
    } catch (error) {
      console.error('Error fetching servers:', error);
      throw error;
    }
  }

  // Create VPN account (modified to work with both SQLite API and Supabase)
  async createAccount(request: CreateAccountRequest): Promise<{ success: boolean; data?: AccountData; message: string }> {
    try {
      if (!this.validateUsername(request.username)) {
        return {
          success: false,
          message: '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.'
        };
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: '❌ Anda harus login terlebih dahulu.'
        };
      }

      // Call the original SQLite createAccount API (unchanged)
      const response = await axios.post(`${SQLITE_API_BASE}/create`, {
        userId: user.id,
        username: request.username,
        password: request.password || "123",
        protocol: request.protocol,
        duration: request.duration,
        quota: request.quota || 0,
        ipLimit: request.ipLimit || 2,
        serverId: parseInt(request.serverId)
      });

      if (!response.data.success) {
        return {
          success: false,
          message: response.data.message || '❌ Gagal membuat akun. Silakan coba lagi.'
        };
      }

      // Store the VPN account in Supabase
      const { error: supabaseError } = await supabase
        .from('vpn_accounts')
        .insert({
          user_id: user.id,
          username: request.username,
          password: request.password || "123",
          protocol: request.protocol,
          server_id: parseInt(request.serverId),
          duration: request.duration,
          quota: request.quota || 0,
          ip_limit: request.ipLimit || 2
        });

      if (supabaseError) {
        console.error('Error storing VPN account in Supabase:', supabaseError);
        // Don't fail the request, just log the error since the VPN account was created successfully
      }

      // Transform the response to match expected format
      const accountData: AccountData = {
        username: response.data.data.username || request.username,
        domain: response.data.data.domain || '',
        expired: response.data.data.expired || new Date(Date.now() + request.duration * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID'),
        ip_limit: (request.ipLimit || 2).toString(),
        quota: request.quota ? `${request.quota} GB` : undefined
      };

      // Add protocol-specific data
      if (response.data.data) {
        const data = response.data.data;
        
        if (request.protocol === 'ssh') {
          accountData.password = data.password || request.password || "123";
          accountData.ssh_ws_port = data.ssh_ws_port || '80';
          accountData.ssh_ssl_port = data.ssh_ssl_port || '443';
        } else {
          accountData.uuid = data.uuid;
          
          if (data.vmess_ws) (accountData as any).vmess_ws = data.vmess_ws;
          if (data.vmess_grpc) (accountData as any).vmess_grpc = data.vmess_grpc;
          if (data.vless_ws) (accountData as any).vless_ws = data.vless_ws;
          if (data.vless_grpc) (accountData as any).vless_grpc = data.vless_grpc;
          if (data.trojan_ws) (accountData as any).trojan_ws = data.trojan_ws;
          if (data.trojan_grpc) (accountData as any).trojan_grpc = data.trojan_grpc;
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
  }

  // Get user's VPN accounts from Supabase
  async getUserAccounts(): Promise<VPNAccount[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('vpn_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      throw error;
    }
  }

  // Validate username
  validateUsername(username: string): boolean {
    return !/\s/.test(username) && /^[a-zA-Z0-9]+$/.test(username);
  }
}

export const supabaseVPNService = new SupabaseVPNService();
