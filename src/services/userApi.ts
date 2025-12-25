import axios from 'axios';
import { forceLogoutToLogin } from '@/utils/authSession';

export const userApi = axios.create({
  baseURL: '/api',
});

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
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const code = error?.response?.data?.code;
    if (status === 401 || code === 'TOKEN_EXPIRED') {
      forceLogoutToLogin('token_expired_api_error');
    }
    return Promise.reject(error);
  }
);
