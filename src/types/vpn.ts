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
  max_users?: number;
  max_account_creation?: number;
}

export interface VPNAccount {
  id: string;
  username: string;
  protocol: VPNProtocol;
  server_name: string;
  server_domain: string;
  expires_at: string;
  status: 'active' | 'expired' | 'suspended';
  quota?: number;
  ip_limit?: number;
  created_at: string;
  connection_details?: any;
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

export type VPNProtocol = 'ssh' | 'vmess' | 'vless' | 'trojan';

export interface CreateAccountRequest {
  userId?: string;
  username: string;
  password?: string;
  protocol: VPNProtocol;
  duration: number; // days
  quota?: number; // GB
  ipLimit?: number;
  serverId: string;
}
