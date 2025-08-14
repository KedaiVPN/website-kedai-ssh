
// Fixed daily pricing per IP limit in Rupiah
export const PRICING_BY_IP_LIMIT = {
  1: 330,  // 1 IP = Rp330/hari
  2: 430,  // 2 IP = Rp430/hari  
  4: 600   // 4 IP/STB = Rp600/hari
} as const;

export type IPLimit = keyof typeof PRICING_BY_IP_LIMIT;

// Calculate total cost based on IP limit, duration and user role
export const calculateTotalCost = (ipLimit: number, duration: number, userRole: 'member' | 'reseller' = 'member'): number => {
  const dailyPrice = PRICING_BY_IP_LIMIT[ipLimit as IPLimit];
  if (!dailyPrice) {
    throw new Error(`Invalid IP limit: ${ipLimit}`);
  }
  
  const baseCost = dailyPrice * duration;
  
  // Apply 50% discount for resellers
  if (userRole === 'reseller') {
    return Math.floor(baseCost * 0.5);
  }
  
  return baseCost;
};

// Get daily price for IP limit based on user role
export const getDailyPrice = (ipLimit: number, userRole: 'member' | 'reseller' = 'member'): number => {
  const price = PRICING_BY_IP_LIMIT[ipLimit as IPLimit];
  if (!price) {
    throw new Error(`Invalid IP limit: ${ipLimit}`);
  }
  
  // Apply 50% discount for resellers
  if (userRole === 'reseller') {
    return Math.floor(price * 0.5);
  }
  
  return price;
};

// Format price to Rupiah
export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

// Get pricing description for display
export const getPricingDescription = (ipLimit: number, userRole: 'member' | 'reseller' = 'member'): string => {
  const dailyPrice = getDailyPrice(ipLimit, userRole);
  return `${formatRupiah(dailyPrice)}/hari`;
};

// Calculate pricing breakdown for display
export const getPricingBreakdown = (ipLimit: number, duration: number, userRole: 'member' | 'reseller' = 'member') => {
  const dailyPrice = getDailyPrice(ipLimit, userRole);
  const totalCost = calculateTotalCost(ipLimit, duration, userRole);
  
  const discountText = userRole === 'reseller' ? ' (Diskon Reseller 50%)' : '';
  
  return {
    dailyPrice,
    duration,
    totalCost,
    userRole,
    breakdown: `${formatRupiah(dailyPrice)} × ${duration} hari = ${formatRupiah(totalCost)}${discountText}`
  };
};
