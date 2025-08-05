
// Quota mapping based on IP limits
export const QUOTA_BY_IP_LIMIT = {
  1: 200, // 1 IP = 200GB
  2: 400, // 2 IP = 400GB
  4: 600  // 4 IP/STB = 600GB
} as const;

export type IPLimit = keyof typeof QUOTA_BY_IP_LIMIT;

export const calculateQuotaFromIPLimit = (ipLimit: number): number => {
  return QUOTA_BY_IP_LIMIT[ipLimit as IPLimit] || 200; // Default to 200GB if not found
};

export const getQuotaDisplayText = (ipLimit: number): string => {
  const quota = calculateQuotaFromIPLimit(ipLimit);
  return `${quota}GB`;
};
