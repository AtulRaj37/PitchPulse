import { apiClient } from './api.client';

export class MatchService {
  static async getMatches(): Promise<any[]> {
    const res = await apiClient.get('/matches');
    return Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.items || res.data?.data?.matches || []);
  }

  static async getMatchById(matchId: string) {
    const res = await apiClient.get(`/matches/${matchId}`);
    return res.data?.data || res.data;
  }

  static async createMatch(payload: any) {
    const res = await apiClient.post('/matches', payload);
    return res.data?.data || res.data;
  }

  static async recordToss(matchId: string, winnerId: string, decision: 'BAT' | 'BOWL') {
    const res = await apiClient.post('/commands/toss', {
      matchId,
      winnerTeamId: winnerId,
      decision,
    });
    return res.data?.data || res.data;
  }

  static async deleteMatch(matchId: string) {
    const res = await apiClient.delete(`/matches/${matchId}`);
    return res.data?.data || res.data;
  }
}
