import { VPNProtocol } from '@/types/vpn';
import { Shield, Server, Lock, Key } from 'lucide-react';

export const PROTOCOL_CONFIGS = {
  ssh: {
    id: 'ssh' as VPNProtocol,
    name: 'SSH',
    title: 'SSH Servers',
    description: 'Secure Shell tunneling dengan enkripsi tinggi',
    icon: Shield,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    gradientColor: 'from-blue-500 to-blue-600',
    statusColor: 'bg-blue-500'
  },
  vmess: {
    id: 'vmess' as VPNProtocol,
    name: 'VMess',
    title: 'VMess Servers',
    description: 'V2Ray protocol dengan performa optimal',
    icon: Server,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
    gradientColor: 'from-green-500 to-green-600',
    statusColor: 'bg-green-500'
  },
  vless: {
    id: 'vless' as VPNProtocol,
    name: 'VLESS',
    title: 'VLESS Servers',
    description: 'V2Ray protocol ringan dan cepat',
    icon: Lock,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    gradientColor: 'from-purple-500 to-purple-600',
    statusColor: 'bg-purple-500'
  },
  trojan: {
    id: 'trojan' as VPNProtocol,
    name: 'Trojan',
    title: 'Trojan Servers',
    description: 'Protocol dengan kamuflase HTTPS',
    icon: Key,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
    gradientColor: 'from-red-500 to-red-600',
    statusColor: 'bg-red-500'
  }
};

export const PROTOCOLS = Object.values(PROTOCOL_CONFIGS);