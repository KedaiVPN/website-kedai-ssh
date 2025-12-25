import { forceLogoutToLogin } from '@/utils/authSession';

export const userFetch = async (input: RequestInfo, init: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token');
  }

  const headers = new Headers(init.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    forceLogoutToLogin('token_expired_fetch');
    throw new Error('Session expired');
  }

  return response;
};
