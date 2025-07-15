
// File definisi tipe data untuk sistem VPN
// Berisi interface dan tipe data yang digunakan di seluruh aplikasi

// Interface untuk data server VPN
export interface Server {
  id: string; // ID unik server
  name: string; // Nama server
  domain: string; // Domain server
  location: string; // Lokasi server
  auth: string; // Kunci otentikasi server
  status: 'online' | 'offline' | 'maintenance'; // Status server
  protocols: VPNProtocol[]; // Protocol yang didukung server
  ping: number; // Latency ping server (ms)
  users: number; // Jumlah pengguna aktif
}

// Interface untuk data akun VPN yang dibuat
export interface AccountData {
  username: string; // Nama pengguna
  password?: string; // Password (opsional untuk beberapa protocol)
  uuid?: string; // UUID untuk protocol tertentu
  domain: string; // Domain server
  expired: string; // Tanggal kedaluwarsa akun
  quota?: string; // Kuota data (opsional)
  ip_limit: string; // Batas IP yang bisa menggunakan akun
  
  // Data khusus untuk SSH
  ssh_ws_port?: string; // Port WebSocket SSH
  ssh_ssl_port?: string; // Port SSL SSH
  
  // Data khusus untuk V2Ray
  vmess_tls_link?: string; // Link VMess dengan TLS
  vmess_nontls_link?: string; // Link VMess tanpa TLS
  vmess_grpc_link?: string; // Link VMess dengan gRPC
  vless_tls_link?: string; // Link VLess dengan TLS
  vless_nontls_link?: string; // Link VLess tanpa TLS
  vless_grpc_link?: string; // Link VLess dengan gRPC
  
  // Data khusus untuk Trojan
  trojan_tls_link?: string; // Link Trojan dengan TLS
  trojan_nontls_link1?: string; // Link Trojan tanpa TLS
  trojan_grpc_link?: string; // Link Trojan dengan gRPC
  ns_domain?: string; // Domain name server
}

// Tipe untuk protocol VPN yang didukung
export type VPNProtocol = 'ssh' | 'vmess' | 'vless' | 'trojan';

// Interface untuk request pembuatan akun baru
export interface CreateAccountRequest {
  userId: string; // ID pengguna yang membuat request
  username: string; // Username yang diinginkan
  password?: string; // Password (opsional untuk beberapa protocol)
  protocol: VPNProtocol; // Protocol yang dipilih
  duration: number; // Durasi akun dalam hari
  quota?: number; // Kuota data dalam GB (opsional)
  ipLimit?: number; // Batas jumlah IP
  serverId: string; // ID server yang dipilih
}
