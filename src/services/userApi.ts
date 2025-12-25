import axios from 'axios';
import { forceLogoutToLogin } from '@/utils/authSession';

export const userApi = axios.create({
  baseURL: '/api',
});

const handleBlockedUser = (message?: string) => {
  const normalized = message?.toLowerCase() || '';
  const isBlocked =
    normalized.includes('diblokir') ||
    normalized.includes('di blokir') ||
    normalized.includes('blocked') ||
    normalized.includes('dikunci') ||
    normalized.includes('di kunci') ||
    normalized.includes('locked');

  if (isBlocked) {
    localStorage.removeItem('auth_token');
    window.location.replace('/blocked');
    return true;
  }
  return false;
};

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

userApi.interceptors.response.use(
  (response) => {
    if (response.data?.code === 'TOKEN_EXPIRED') {
      forceLogoutToLogin('token_expired_api');
      return Promise.reject(new Error('Session expired'));
    }
    if (handleBlockedUser(response.data?.message)) {
      return Promise.reject(new Error('User blocked'));
    }
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    const message = error?.response?.data?.message;
    if (handleBlockedUser(message)) {
      return Promise.reject(error);
    }
    const isInvalidToken =
      status === 403 &&
      (code === 'INVALID_TOKEN' || (typeof message === 'string' && message.toLowerCase().includes('invalid token')));

    if (status === 401 || code === 'TOKEN_EXPIRED' || isInvalidToken) {
      forceLogoutToLogin('token_expired_api_error');
    }
    return Promise.reject(error);
  }
);
