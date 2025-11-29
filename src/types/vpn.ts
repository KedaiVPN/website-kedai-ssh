
export interface Server {
  id: string;
  name: string;
  domain: string;
  location: string;
  auth: string;
  status: 'online' | 'offline' | 'maintenance' | 'full';
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
  // ZiVPN specific
  zivpn_link?: string;
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
  // ZiVPN specific
  zivpn_link?: string;
}

export interface DashboardStats {
  totalAccounts: number;
  activeAccounts: number;
  balance: number;
  totalServers: number;
}

export type VPNProtocol = 'ssh' | 'vmess' | 'vless' | 'trojan' | 'zivpn';

export interface CreateAccountRequest {
  userId?: string; // Now optional since it comes from token
  username?: string; // Optional for zivpn (only needs password)
  password?: string;
  protocol: VPNProtocol;
  duration: number; // days
  quota?: number; // GB
  ip_limit?: number;
  serverId: string;
}

export interface RenewAccountRequest {
  accountId: number;
  duration: number; // days - only field user can modify
  // quota and ip_limit removed - will use existing values from database
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

export interface LeaderboardEntry {
  username: string;
  role: 'member' | 'reseller';
  total_transaksi: number;
}

export interface TopupTransaction {
  id: number;
  user_id: number;
  amount: number;
  amount_gross: number;
  duitku_reference: string;
  duitku_merchant_order_id: string;
  payment_method: string;
  status: 'pending' | 'success' | 'failed' | 'expired';
  payment_url?: string;
  qr_code_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  message?: string;
  flow?: 'DIRECT_QRIS' | 'DIRECT_VA' | 'REDIRECT';
  reference?: string;
  qrCodeUrl?: string;
  payCode?: string;
  paymentName?: string;
  paymentUrl?: string;
  instructions?: Array<{
    title: string;
    steps: string[];
  }>;
  amountNet?: number;
  amountGross?: number;
}

export interface TopupHistoryResponse {
  success: boolean;
  message?: string;
  data?: TopupTransaction[];
}

export interface TopupResponse {
  success: boolean;
  message?: string;
  data?: {
    status: string;
    amount?: number;
    payment_method?: string;
    created_at?: string;
    newToken?: string;
  };
}
