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
  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    try {
      data = await response.clone().json();
    } catch {
      // ignore json parse errors
    }
  }

  const message = typeof data?.message === 'string' ? data.message.toLowerCase() : '';
  const isInvalidToken =
    response.status === 403 &&
    (data?.code === 'INVALID_TOKEN' || message.includes('invalid token'));

  if (!shouldForceLogout && data?.code === 'TOKEN_EXPIRED') {
    shouldForceLogout = true;
  }

  if (!shouldForceLogout && isInvalidToken) {
    shouldForceLogout = true;
  }

  if (shouldForceLogout) {
    forceLogoutToLogin('token_expired_fetch');
    throw new Error('Session expired');
  }

  return response;
};
