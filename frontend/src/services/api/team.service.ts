import { apiClient } from './api.client';

export class TeamService {
  static async getTeams(): Promise<any[]> {
    const res = await apiClient.get('/teams');
    return Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.items || res.data?.data?.teams || []);
  }

  static async createTeam(payload: any) {
    const res = await apiClient.post('/teams', payload);
    return res.data?.data || res.data;
  }
}
