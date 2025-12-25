import { LeaderboardEntry } from '@/types/vpn';
import { userApi } from './userApi';

const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const response = await userApi.get('/leaderboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    throw error;
  }
};

export const leaderboardService = {
  getLeaderboard,
};
