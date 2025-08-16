
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api/admin-auth';

interface AdminRegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface AdminLoginRequest {
  identifier: string; // email or username
  password: string;
}

interface AdminAuthResponse {
  success: boolean;
  message: string;
  admin?: {
    id: number;
    username: string;
    email: string;
  };
  error?: string;
}

interface SetupCheckResponse {
  requiresSetup: boolean;
}

export const adminAuthService = {
  // Check if admin setup is required
  checkSetup: async (): Promise<SetupCheckResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/check-setup`);
      return response.data;
    } catch (error: any) {
      console.error('Error checking admin setup:', error);
      throw new Error(error.response?.data?.error || 'Failed to check setup status');
    }
  },

  // Register first admin
  register: async (data: AdminRegisterRequest): Promise<AdminAuthResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error registering admin:', error);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  // Login admin
  login: async (data: AdminLoginRequest): Promise<AdminAuthResponse> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error logging in admin:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  // Get current admin info
  getMe: async (adminId: string): Promise<AdminAuthResponse> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/me`, {
        headers: {
          'x-admin-id': adminId
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error getting admin info:', error);
      throw new Error(error.response?.data?.error || 'Failed to get admin info');
    }
  },

  // Get current admin from session
  getCurrentAdmin: async () => {
    const session = adminAuthService.getAdminSession();
    if (!session) {
      return null;
    }

    try {
      const response = await adminAuthService.getMe(session.id.toString());
      if (response.admin) {
        return response.admin;
      }
      return null;
    } catch (error) {
      console.error('Error getting current admin:', error);
      // Clear invalid session
      adminAuthService.clearAdminSession();
      return null;
    }
  },

  // Storage helpers
  setAdminSession: (admin: { id: number; username: string; email: string }) => {
    localStorage.setItem('admin_logged_in', 'true');
    localStorage.setItem('admin_data', JSON.stringify(admin));
  },

  getAdminSession: () => {
    const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true';
    const adminData = localStorage.getItem('admin_data');
    
    if (isLoggedIn && adminData) {
      try {
        return JSON.parse(adminData);
      } catch (error) {
        console.error('Error parsing admin data:', error);
        return null;
      }
    }
    return null;
  },

  clearAdminSession: () => {
    localStorage.removeItem('admin_logged_in');
    localStorage.removeItem('admin_data');
    localStorage.removeItem('admin_password'); // Remove old password storage
  }
};
