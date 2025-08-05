
// Fixed daily pricing per IP limit in Rupiah
export const PRICING_BY_IP_LIMIT = {
  1: 330,  // 1 IP = Rp330/hari
  2: 430,  // 2 IP = Rp430/hari  
  4: 600   // 4 IP/STB = Rp600/hari
} as const;

export type IPLimit = keyof typeof PRICING_BY_IP_LIMIT;

// Calculate total cost based on IP limit and duration
export const calculateTotalCost = (ipLimit: number, duration: number): number => {
  const dailyPrice = PRICING_BY_IP_LIMIT[ipLimit as IPLimit];
  if (!dailyPrice) {
    throw new Error(`Invalid IP limit: ${ipLimit}`);
  }
  return dailyPrice * duration;
};

// Get daily price for IP limit
export const getDailyPrice = (ipLimit: number): number => {
  const price = PRICING_BY_IP_LIMIT[ipLimit as IPLimit];
  if (!price) {
    throw new Error(`Invalid IP limit: ${ipLimit}`);
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
export const getPricingDescription = (ipLimit: number): string => {
  const dailyPrice = getDailyPrice(ipLimit);
  return `${formatRupiah(dailyPrice)}/hari`;
};

// Calculate pricing breakdown for display
export const getPricingBreakdown = (ipLimit: number, duration: number) => {
  const dailyPrice = getDailyPrice(ipLimit);
  const totalCost = calculateTotalCost(ipLimit, duration);
  
  return {
    dailyPrice,
    duration,
    totalCost,
    breakdown: `${formatRupiah(dailyPrice)} × ${duration} hari = ${formatRupiah(totalCost)}`
  };
};
