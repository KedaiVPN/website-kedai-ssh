
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
