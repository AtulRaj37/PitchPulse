// Player Service
// Handles player profiles and searching

import { prisma } from '../../core/db/prisma.js';
import { AppError, NotFoundError } from '../../core/middleware/error.middleware.js';

export class PlayerService {
  /**
   * Create a player
   */
  static async createPlayer(data: any) {
    return prisma.player.create({
      data,
    });
  }

  /**
   * Get player by ID
   */
  static async getPlayerById(id: string) {
    const player = await (prisma.player as any).findUnique({
      where: { id },
      include: {
        team: true,
        BattingStats: true,
        BowlingStats: true,
      },
    });

    if (!player) {
      throw new NotFoundError('Player', id);
    }
    return player;
  }

  /**
   * List players with pagination and search
   */
  static async listPlayers(query: { limit?: number; offset?: number; search?: string; teamId?: string }) {
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    
    let where: any = {};
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }
    if (query.teamId) {
      where.teamId = query.teamId;
    }

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { name: 'asc' },
        include: { team: { select: { name: true } } }
      }),
      prisma.player.count({ where }),
    ]);

    return { players, total };
  }

  /**
   * Update a player
   */
  static async updatePlayer(id: string, data: any) {
    return prisma.player.update({
      where: { id },
      data,
    });
  }

  /**
   * Get player match history
   */
  static async getMatchHistory(playerId: string, query: { limit?: number; offset?: number }) {
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    const [matchPlayers, total] = await Promise.all([
      prisma.matchPlayer.findMany({
        where: { playerId },
        take: limit,
        skip: offset,
        include: {
          match: {
            include: { team1: true, team2: true }
          }
        },
        orderBy: {
          match: { startTime: 'desc' }
        }
      }),
      prisma.matchPlayer.count({ where: { playerId } })
    ]);

    const matches = matchPlayers.map(mp => mp.match);

    return { matches, total };
  }
}

export default PlayerService;
