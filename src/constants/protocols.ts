// Konstanta untuk definisi protocol VPN yang tersedia
import { Server, Shield, Globe, Lock } from 'lucide-react';
import { VPNProtocol } from '@/types/vpn';

// Interface untuk mendefinisikan struktur data protocol
export interface ProtocolConfig {
  id: VPNProtocol;
  name: string;
  description: string;
  icon: any; // Komponen icon dari lucide-react
  color: string; // Warna text untuk icon
  bgColor: string; // Warna background
  borderColor: string; // Warna border
  gradientColor: string; // Gradient untuk efek visual
}

// Daftar protocol VPN yang didukung dengan konfigurasinya
export const PROTOCOLS: ProtocolConfig[] = [
  {
    id: 'ssh',
    name: 'SSH Tunnel',
    description: 'Secure Shell tunneling dengan enkripsi kuat dan kompatibilitas tinggi',
    icon: Server,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-300',
    gradientColor: 'from-blue-500 to-blue-600'
  },
  {
    id: 'vmess',
    name: 'VMess',
    description: 'Protocol V2Ray dengan performa tinggi dan kemampuan bypass yang baik',
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-300',
    gradientColor: 'from-green-500 to-green-600'
  },
  {
    id: 'vless',
    name: 'VLess',
    description: 'Protocol ringan tanpa enkripsi ganda untuk performa maksimal',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-300',
    gradientColor: 'from-purple-500 to-purple-600'
  },
  {
    id: 'trojan',
    name: 'Trojan',
    description: 'Protocol yang menyamar sebagai traffic HTTPS untuk bypass maksimal',
    icon: Lock,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-300',
    gradientColor: 'from-red-500 to-red-600'
  }
];

// Objek konfigurasi protocol untuk akses yang lebih mudah berdasarkan key
export const PROTOCOL_CONFIGS: Record<VPNProtocol, ProtocolConfig> = {
  ssh: {
    id: 'ssh',
    name: 'SSH Tunnel',
    description: 'Secure Shell tunneling dengan enkripsi kuat dan kompatibilitas tinggi',
    icon: Server,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-300',
    gradientColor: 'from-blue-500 to-blue-600'
  },
  vmess: {
    id: 'vmess',
    name: 'VMess',
    description: 'Protocol V2Ray dengan performa tinggi dan kemampuan bypass yang baik',
    icon: Shield,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    borderColor: 'border-green-300',
    gradientColor: 'from-green-500 to-green-600'
  },
  vless: {
    id: 'vless',
    name: 'VLess',
    description: 'Protocol ringan tanpa enkripsi ganda untuk performa maksimal',
    icon: Globe,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-300',
    gradientColor: 'from-purple-500 to-purple-600'
  },
  trojan: {
    id: 'trojan',
    name: 'Trojan',
    description: 'Protocol yang menyamar sebagai traffic HTTPS untuk bypass maksimal',
    icon: Lock,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-300',
    gradientColor: 'from-red-500 to-red-600'
  }
};

// Fungsi helper untuk mendapatkan konfigurasi protocol berdasarkan ID
export const getProtocolConfig = (protocolId: VPNProtocol): ProtocolConfig | undefined => {
  return PROTOCOLS.find(protocol => protocol.id === protocolId);
};

// Fungsi helper untuk mendapatkan daftar semua protocol ID
export const getAllProtocolIds = (): VPNProtocol[] => {
  return PROTOCOLS.map(protocol => protocol.id);
};

// Fungsi helper tambahan untuk mendapatkan konfigurasi protocol dengan judul yang sesuai
export const getProtocolConfigWithTitle = (protocolId: VPNProtocol) => {
  const config = PROTOCOL_CONFIGS[protocolId];
  if (!config) return null;
  
  return {
    ...config,
    title: `Buat Akun ${config.name}`,
    statusColor: config.color.replace('text-', 'bg-')
  };
};
