
export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  location: string;
  protocol: 'ssh' | 'vmess' | 'vless' | 'trojan';
  status: 'online' | 'offline' | 'maintenance';
  maxUsers: number;
  currentUsers: number;
}

export interface VPNAccount {
  id: string;
  username: string;
  password?: string;
  serverId: string;
  serverName: string;
  serverHost: string;
  protocol: 'ssh' | 'vmess' | 'vless' | 'trojan';
  expiryDate: string;
  status: 'active' | 'expired' | 'suspended';
  ipLimit: number;
  createdAt: string;
  config?: string;
}

export interface UserVPNAccount extends VPNAccount {
  userId: string;
  // Backend API properties (snake_case)
  server_name: string;
  server_domain: string;
  server_location: string;
  expired_date: string;
  ip_limit: number;
  quota: number;
  created_at: string;
  
  // SSH specific properties
  ssh_ws_port?: string;
  ssh_ssl_port?: string;
  
  // V2Ray protocol properties
  uuid?: string;
  ns_domain?: string;
  
  // VMess links
  vmess_tls_link?: string;
  vmess_nontls_link?: string;
  vmess_grpc_link?: string;
  
  // VLess links
  vless_tls_link?: string;
  vless_nontls_link?: string;
  vless_grpc_link?: string;
  
  // Trojan links
  trojan_tls_link?: string;
  trojan_nontls_link1?: string;
  trojan_grpc_link?: string;
}

export interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  balance: number; // Changed from expiredAccounts to balance
  totalServers: number;
}

export interface CreateAccountRequest {
  protocol: 'ssh' | 'vmess' | 'vless' | 'trojan';
  serverId: string;
  username: string;
  password?: string;
  duration: number;
  ipLimit: number;
}

export interface CreateAccountResponse {
  success: boolean;
  data?: VPNAccount;
  message: string;
}

export interface RenewAccountRequest {
  accountId: string | number;
  duration: number;
}
