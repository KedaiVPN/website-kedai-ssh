export interface Server {
  id: string;
  name: string;
  domain: string;
  location: string;
  auth: string;
  status: 'online' | 'offline' | 'maintenance';
  protocols: VPNProtocol[];
  ping: number;
  users: number;
  batas_create_akun: number;
  total_create_akun: number;
}

export interface AccountData {
  username: string;
  password?: string;
  uuid?: string;
  domain: string;
  expired: string;
  quota?: string;
  ip_limit: string;
  // SSH specific
  ssh_ws_port?: string;
  ssh_ssl_port?: string;
  // V2Ray specific
  vmess_tls_link?: string;
  vmess_nontls_link?: string;
  vmess_grpc_link?: string;
  vless_tls_link?: string;
  vless_nontls_link?: string;
  vless_grpc_link?: string;
  // Trojan specific
  trojan_tls_link?: string;
  trojan_nontls_link1?: string;
  trojan_grpc_link?: string;
  ns_domain?: string;
}

export interface UserVPNAccount {
  id: number;
  username: string;
  password?: string;
  protocol: VPNProtocol;
  server_id: number;
  server_name: string;
  server_domain: string;
  server_location: string;
  server_status: string;
  duration: number;
  quota: number;
  ip_limit: number;
  created_at: string;
  expired_date: string;
  status: 'active' | 'expired';
  // SSH specific fields
  ssh_ws_port?: string;
  ssh_ssl_port?: string;
  // V2Ray specific fields
  uuid?: string;
  ns_domain?: string;
  vmess_tls_link?: string;
  vmess_nontls_link?: string;
  vmess_grpc_link?: string;
  vless_tls_link?: string;
  vless_nontls_link?: string;
  vless_grpc_link?: string;
  trojan_tls_link?: string;
  trojan_nontls_link1?: string;
  trojan_grpc_link?: string;
}

export interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  expiredAccounts: number;
  totalServers: number;
}

export type VPNProtocol = 'ssh' | 'vmess' | 'vless' | 'trojan';

export interface CreateAccountRequest {
  userId?: string; // Now optional since it comes from token
  username: string;
  password?: string;
  protocol: VPNProtocol;
  duration: number; // days
  quota?: number; // GB
  ip_limit?: number;
  serverId: string;
}

export interface RenewAccountRequest {
  accountId: number;
  duration: number; // days
  quota?: number; // GB for non-SSH protocols
  ip_limit: number;
}

export interface DeleteAccountResponse {
  success: boolean;
  message: string;
  sisaHari?: number;
  refund?: number;
}

export interface RenewAccountResponse {
  success: boolean;
  message: string;
  data?: {
    expired_date: string;
    duration: number;
    quota?: number;
    ip_limit: number;
  };
}
