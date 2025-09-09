
import axios from 'axios';

const API_BASE_URL = '/api/admin-auth';

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

class AdminAuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('admin_token');
    if (this.token) {
      this.setAuthHeader(this.token);
    }
  }

  private setAuthHeader(token: string) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  private removeAuthHeader() {
    delete axios.defaults.headers.common['Authorization'];
  }

  async checkSetup(): Promise<SetupCheckResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/check-setup`);
      return response.data;
    } catch (error) {
      console.error('Error checking setup:', error);
      throw new Error('Gagal memeriksa status setup admin');
    }
  }

  async register(username: string, email: string, password: string): Promise<AdminAuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, {
        username,
        email,
        password
      });

      const data = response.data;
      if (data.success && data.token) {
        this.token = data.token;
        localStorage.setItem('admin_token', data.token);
        this.setAuthHeader(data.token);
      }

      return data;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Gagal mendaftarkan admin');
    }
  }

  async login(identifier: string, password: string): Promise<AdminAuthResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        identifier,
        password
      });

      const data = response.data;
      if (data.success && data.token) {
        this.token = data.token;
        localStorage.setItem('admin_token', data.token);
        this.setAuthHeader(data.token);
      }

      return data;
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Gagal login');
    }
  }

  async getMe(): Promise<AdminAuthResponse> {
    try {
      const response = await axios.get(`${API_BASE_URL}/me`);
      return response.data;
    } catch (error: any) {
      console.error('Get me error:', error);
      if (error.response?.data) {
        return error.response.data;
      }
      throw new Error('Gagal mengambil data admin');
    }
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('admin_token');
    this.removeAuthHeader();
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const adminAuthService = new AdminAuthService();
