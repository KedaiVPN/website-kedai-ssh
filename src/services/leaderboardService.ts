import axios from 'axios';
import { LeaderboardEntry } from '@/types/vpn';

const API_URL = '/api';

const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await axios.get(`${API_URL}/leaderboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
};

export const leaderboardService = {
  getLeaderboard,
};
