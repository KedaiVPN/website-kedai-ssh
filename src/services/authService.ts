import axios from 'axios';
import { RegisterRequest, RegisterResponse, SetUsernameRequest, SetUsernameResponse } from '@/types/auth';

const API_BASE_URL = 'http://localhost:3001/api/auth';

export const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  },

  async setUsername(data: SetUsernameRequest): Promise<SetUsernameResponse> {
    try {
      const response = await axios.post(`${API_BASE_URL}/google/set-username`, data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error occurred' };
    }
  }
};