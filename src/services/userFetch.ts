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

  let shouldForceLogout = response.status === 401;

  if (!shouldForceLogout) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        const data = await response.clone().json();
        if (data?.code === 'TOKEN_EXPIRED') {
          shouldForceLogout = true;
        }
      } catch {
        // ignore json parse errors
      }
    }
  }

  if (shouldForceLogout) {
    forceLogoutToLogin('token_expired_fetch');
    throw new Error('Session expired');
  }

  return response;
};
