
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPingColor(ping: string | number): string {
  // Convert ping to number if it's a string
  const pingValue = typeof ping === 'string' ? parseInt(ping) : ping;
  
  if (pingValue >= 0 && pingValue <= 500) {
    return 'text-green-500';
  } else if (pingValue > 500 && pingValue <= 999) {
    return 'text-yellow-500';
  } else {
    return 'text-red-500';
  }
}

export function getStatusColor(status: 'online' | 'offline' | 'maintenance' | 'full'): string {
  switch (status) {
    case 'online':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'full':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'offline':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

export function getStatusBadge(status: 'online' | 'offline' | 'maintenance' | 'full') {
  switch (status) {
    case 'online':
      return {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        text: 'Online'
      };
    case 'maintenance':
      return {
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        text: 'Maintenance'
      };
    case 'full':
      return {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        text: 'Penuh'
      };
    case 'offline':
      return {
        variant: 'destructive' as const,
        className: '',
        text: 'Offline'
      };
    default:
      return {
        variant: 'secondary' as const,
        className: '',
        text: 'Unknown'
      };
  }
}
