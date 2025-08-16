
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
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await fetch('/api/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    return response.json();
  }
};
