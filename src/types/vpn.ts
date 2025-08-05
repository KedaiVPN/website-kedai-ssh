
export type VPNProtocol = 'ssh' | 'vmess' | 'vless' | 'trojan';

export interface Server {
  id: string;
  name: string;
  host: string;
  port: number;
  location: string;
  protocol: VPNProtocol;
  protocols: VPNProtocol[]; // Array of supported protocols
  status: 'online' | 'offline' | 'maintenance';
  maxUsers: number;
  currentUsers: number;
  // Additional server properties used in components
  domain: string;
  ping: number;
  users: number;
  batas_create_akun: number;
}

export interface VPNAccount {
  id: string;
  username: string;
  password?: string;
  serverId: string;
  serverName: string;
  serverHost: string;
  protocol: VPNProtocol;
  expiryDate: string;
  status: 'active' | 'expired' | 'suspended';
  ipLimit: number;
  createdAt: string;
  config?: string;
}

// AccountData type alias for backward compatibility
export type AccountData = UserVPNAccount;

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
  
  // Additional display properties
  domain: string;
  expired: string;
  
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
  protocol: VPNProtocol;
  serverId: string;
  username: string;
  password?: string;
  duration: number;
  quota?: number; // Added quota property
  ipLimit: number;
  ip_limit: number; // Backend snake_case version
}

export interface CreateAccountResponse {
  success: boolean;
  data?: AccountData;
  message: string;
}

export interface RenewAccountRequest {
  accountId: string | number;
  duration: number;
}
