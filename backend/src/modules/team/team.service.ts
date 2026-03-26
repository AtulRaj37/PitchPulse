// Team Service
// Handles Team and Player management operations

import { prisma } from '../../core/db/prisma.js';
import { AppError, NotFoundError } from '../../core/middleware/error.middleware.js';

export class TeamService {
  /**
   * Create a team
   */
  static async createTeam(data: { name: string; shortName?: string; logoUrl?: string; homeGround?: string; createdBy: string }) {
    const { createdBy, ...rest } = data;
    return prisma.team.create({
      data: {
        ...rest,
        creator: { connect: { id: createdBy } }
      },
    });
  }

  /**
   * Get team by ID
   */
  static async getTeamById(id: string) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: true,
      },
    });

    if (!team) {
      throw new NotFoundError('Team', id);
    }
    return team;
  }

  /**
   * List teams with pagination and optional search
   */
  static async listTeams(query: { limit?: number; offset?: number; search?: string }) {
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const searchFilter = query.search ? {
      name: { contains: query.search, mode: 'insensitive' as const }
    } : {};

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where: searchFilter,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: { players: true }
      }),
      prisma.team.count({ where: searchFilter }),
    ]);

    return { teams, total };
  }

  /**
   * Update a team
   */
  static async updateTeam(id: string, data: { name?: string; shortName?: string; logoUrl?: string }) {
    return prisma.team.update({
      where: { id },
      data,
    });
  }

  /**
   * Add a player to a team's squad
   */
  static async addPlayerToSquad(teamId: string, playerId: string) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundError('Team', teamId);

    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) throw new NotFoundError('Player', playerId);

    return prisma.player.update({
      where: { id: playerId },
      data: { teamId },
    });
  }

  /**
   * Remove a player from a team's squad
   */
  static async removePlayerFromSquad(teamId: string, playerId: string) {
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player || player.teamId !== teamId) {
      throw new AppError('Player is not in this team', 'INVALID_OPERATION', 400);
    }

    return prisma.player.update({
      where: { id: playerId },
      data: { teamId: null },
    });
  }

  /**
   * Get team squad
   */
  static async getSquad(teamId: string) {
    return prisma.player.findMany({
      where: { teamId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Delete team by ID
   */
  static async deleteTeam(id: string) {
    // Check if team exists
    const team = await prisma.team.findUnique({ where: { id } });
    if (!team) {
      throw new NotFoundError('Team', id);
    }

    return prisma.team.delete({
      where: { id },
    });
  }
}

export default TeamService;
