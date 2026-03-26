import { apiClient } from './api.client';

export class TournamentService {
  static async getTournaments(): Promise<any[]> {
    const res = await apiClient.get('/tournaments');
    return Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.items || res.data?.data?.tournaments || []);
  }

  static async createTournament(payload: any) {
    const res = await apiClient.post('/tournaments', payload);
    return res.data?.data || res.data;
  }
}
