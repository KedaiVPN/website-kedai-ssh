
import { userFetch } from './userFetch';

interface ProfileData {
  username: string;
  email: string;
  role: 'member' | 'reseller';
  transaction_count: number;
  created_at: string;
}

interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
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
  }
};
