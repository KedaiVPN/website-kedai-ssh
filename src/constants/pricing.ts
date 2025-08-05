
// Fixed pricing per IP limit (not multiplicative)
export const PRICING_BY_IP_LIMIT = {
  1: 330,  // Rp330/hari untuk 1 IP
  2: 430,  // Rp430/hari untuk 2 IP  
  4: 600   // Rp600/hari untuk 4 IP/STB
} as const;

export type IPLimit = keyof typeof PRICING_BY_IP_LIMIT;

// Calculate daily cost based on IP limit (fixed rate, not multiplicative)
export const calculateDailyCost = (ipLimit: number): number => {
  return PRICING_BY_IP_LIMIT[ipLimit as IPLimit] || 330; // Default to 330 if not found
};

// Calculate total cost for account creation
export const calculateTotalCost = (ipLimit: number, duration: number): number => {
  const dailyCost = calculateDailyCost(ipLimit);
  return dailyCost * duration;
};

// Format currency to Indonesian Rupiah
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Get pricing display text for UI
export const getPricingDisplayText = (ipLimit: number): string => {
  const dailyCost = calculateDailyCost(ipLimit);
  return `${formatCurrency(dailyCost)}/hari`;
};

// Get cost breakdown text for UI
export const getCostBreakdown = (ipLimit: number, duration: number): string => {
  const dailyCost = calculateDailyCost(ipLimit);
  const totalCost = calculateTotalCost(ipLimit, duration);
  return `${formatCurrency(dailyCost)} × ${duration} hari = ${formatCurrency(totalCost)}`;
};
