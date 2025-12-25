export interface JwtPayload {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  exp?: number;
  [key: string]: unknown;
}

export const parseJwt = (token: string): JwtPayload | null => {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

export const getTokenExpMs = (token: string): number | null => {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000;
};

export const isTokenExpired = (token: string, toleransiMs: number = 5000): boolean => {
  const expMs = getTokenExpMs(token);
  if (!expMs) return true;
  return Date.now() >= expMs - toleransiMs;
};

export const forceLogoutToLogin = (alasan?: string) => {
  if (alasan) {
    console.log('forceLogoutToLogin reason:', alasan);
  }
  localStorage.removeItem('auth_token');
  try {
    sessionStorage.clear();
  } catch {
    // Ignore storage errors
  }
  window.location.replace('/login');
};
