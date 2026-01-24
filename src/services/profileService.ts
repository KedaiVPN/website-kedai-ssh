
import { userFetch } from './userFetch';

interface ProfileData {
  username: string;
  email: string;
  role: 'member' | 'reseller';
  transaction_count: number;
  created_at: string;
  auth_provider?: string;
}

interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  message: string;
}

interface BaseResponse {
  success: boolean;
  message: string;
}

export const profileService = {
  // Get user profile data
  async getProfile(): Promise<ProfileResponse> {
    const response = await userFetch('/api/profile', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  },

  // Request OTP for change
  async requestChangeOtp(type: 'username' | 'password' | 'phone'): Promise<BaseResponse> {
    const response = await userFetch('/api/profile/request-change-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    });
    return response.json();
  },

  // Change Username
  async changeUsername(newUsername: string, otp: string): Promise<BaseResponse> {
    const response = await userFetch('/api/profile/change-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newUsername, otp })
    });
    return response.json();
  },

  // Change Password
  async changePassword(newPassword: string, otp: string): Promise<BaseResponse> {
    const response = await userFetch('/api/profile/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword, otp })
    });
    return response.json();
  },

  // Change Phone
  async changePhone(newPhone: string, otp: string): Promise<BaseResponse> {
    const response = await userFetch('/api/profile/change-phone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPhone, otp })
    });
    return response.json();
  }
};
