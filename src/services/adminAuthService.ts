import axios from 'axios';

// Create a dedicated axios instance for admin authentication API
const adminAuthApi = axios.create({
  baseURL: '/api/admin-auth',
});

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  admin?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface SetupCheckResponse {
  success: boolean;
  needsSetup: boolean;
}

// This class now manages token state but doesn't interact with axios directly
class AdminTokenManager {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('admin_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('admin_token', token);
  }

  getToken(): string | null {
    // Always get the freshest token from localStorage to ensure sync across tabs
    return localStorage.getItem('admin_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    this.token = null;
    localStorage.removeItem('admin_token');
  }
}

// Instantiate the manager
const tokenManager = new AdminTokenManager();

// Add a request interceptor to the dedicated axios instance
adminAuthApi.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// The service object now uses the dedicated axios instance and token manager
export const adminAuthService = {
  async checkSetup(): Promise<SetupCheckResponse> {
    const response = await adminAuthApi.post('/check-setup');
    return response.data;
  },

  async register(username: string, email: string, password: string): Promise<AdminAuthResponse> {
    const response = await adminAuthApi.post('/register', { username, email, password });
    if (response.data.success && response.data.token) {
      tokenManager.setToken(response.data.token);
    }
    return response.data;
  },

  async login(identifier: string, password: string): Promise<AdminAuthResponse> {
    const response = await adminAuthApi.post('/login', { identifier, password });
    if (response.data.success && response.data.token) {
      tokenManager.setToken(response.data.token);
    }
    return response.data;
  },

  async getMe(): Promise<AdminAuthResponse> {
    // This call will now automatically have the token from the interceptor
    const response = await adminAuthApi.get('/me');
    return response.data;
  },

  logout(): void {
    tokenManager.logout();
  },

  isLoggedIn(): boolean {
    return tokenManager.isLoggedIn();
  },

  getToken(): string | null {
    return tokenManager.getToken();
  }
};
