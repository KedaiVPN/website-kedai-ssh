
// Type definition for the pricing configuration object
export type PricingConfig = Record<number, number>;

// Type for valid IP limits, derived from a potential pricing config
export type IPLimit = keyof PricingConfig;

// Format price to Rupiah
export const formatRupiah = (amount: number): string => {
  if (typeof amount !== 'number') return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Calculates the daily price for display purposes from a pricing config object.
 * This is a client-side helper to show prices in the UI before a final cost
 * is calculated by the backend.
 * @param pricingConfig The pricing configuration object from the API.
 * @param ipLimit The IP limit to get the price for.
 * @param userRole The user's role, to apply discounts.
 * @returns The calculated daily price for display.
 */
export const getDisplayDailyPrice = (
  pricingConfig: PricingConfig,
  ipLimit: number,
  userRole: 'member' | 'reseller'
): number => {
  const basePrice = pricingConfig[ipLimit as IPLimit];
  if (typeof basePrice !== 'number') {
    return 0;
  }
  
  // Apply 50% discount for resellers for display purposes
  if (userRole === 'reseller') {
    return Math.floor(basePrice * 0.5);
  }
  
  return basePrice;
};

/**
 * Gets the daily price for a specific IP limit and user role.
 * This is a fallback function when server pricing is not available.
 * @param ipLimit The IP limit (1, 2, 4, etc.)
 * @param userRole The user's role ('member' or 'reseller')
 * @returns The daily price
 */
export const getDailyPrice = (ipLimit: number, userRole: 'member' | 'reseller' = 'member'): number => {
  // Default pricing fallback values
  const defaultPricing: PricingConfig = {
    1: 2000,
    2: 3000,
    4: 5000
  };
  
  const basePrice = defaultPricing[ipLimit] || 2000;
  
  // Apply 50% discount for resellers
  if (userRole === 'reseller') {
    return Math.floor(basePrice * 0.5);
  }
  
  return basePrice;
};

/**
 * Calculates the total cost for a duration and IP limit.
 * This is a fallback function when server pricing is not available.
 * @param ipLimit The IP limit
 * @param duration The duration in days
 * @param userRole The user's role ('member' or 'reseller')
 * @returns The total cost
 */
export const calculateTotalCost = (
  ipLimit: number, 
  duration: number, 
  userRole: 'member' | 'reseller' = 'member'
): number => {
  const dailyPrice = getDailyPrice(ipLimit, userRole);
  return dailyPrice * duration;
};
