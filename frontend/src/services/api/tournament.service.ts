import { apiClient } from './api.client';

export class TournamentService {
  static async getTournaments(): Promise<any[]> {
    const res = await apiClient.get('/tournaments');
    return Array.isArray(res.data?.data) ? res.data.data : (res.data?.data?.items || res.data?.data?.tournaments || []);
  }

  static async getTournamentById(id: string) {
    const res = await apiClient.get(`/tournaments/${id}`);
    return res.data?.data;
  }

  static async createTournament(payload: any) {
    const res = await apiClient.post('/tournaments', payload);
    return res.data?.data || res.data;
  }

  static async addTeamToTournament(tournamentId: string, teamId: string) {
    const res = await apiClient.post(`/tournaments/${tournamentId}/teams`, { teamId });
    return res.data?.data;
  }

  static async generateFixtures(tournamentId: string, format: string) {
    const res = await apiClient.post(`/tournaments/${tournamentId}/generate-fixtures`, { format });
    return res.data?.data;
  }

  static async addFixture(tournamentId: string, team1Id: string, team2Id: string) {
    const res = await apiClient.post(`/tournaments/${tournamentId}/fixtures`, { team1Id, team2Id });
    return res.data?.data;
  }

  static async getPointsTable(tournamentId: string) {
    const res = await apiClient.get(`/tournaments/${tournamentId}/points-table`);
    return res.data?.data;
  }

  static async updateTournament(id: string, payload: any) {
    const res = await apiClient.patch(`/tournaments/${id}`, payload);
    return res.data?.data || res.data;
  }

  static async deleteTournament(id: string) {
    const res = await apiClient.delete(`/tournaments/${id}`);
    return res.data?.data || res.data;
  }
}
