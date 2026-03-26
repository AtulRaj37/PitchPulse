import { apiClient } from './api.client';

export class PlayerService {
  /**
   * Update an existing player
   * @param id Player ID
   * @param payload Partial player data mapped to updatePlayerSchema
   */
  static async updatePlayer(id: string, payload: any) {
    const res = await apiClient.patch(`/players/${id}`, payload);
    return res.data?.data || res.data;
  }
}
