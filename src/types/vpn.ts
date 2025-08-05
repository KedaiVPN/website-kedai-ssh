
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
