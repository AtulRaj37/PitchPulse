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
    
    const where: any = {};
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

  /**
   * Get player career stats and recent form
   */
  static async getPlayerStats(playerId: string) {
    // 1. Get exact aggregates
    const career = await prisma.playerStats.findUnique({
      where: { playerId }
    });

    // 2. Get recent batting form
    const recentBatting = await prisma.battingStats.findMany({
      where: { playerId },
      take: 5,
      orderBy: { innings: { match: { startTime: 'desc' } } },
      include: { innings: { include: { match: { include: { team1: true, team2: true } } } } }
    });

    // 3. Get recent bowling form
    const recentBowling = await prisma.bowlingStats.findMany({
      where: { playerId },
      take: 5,
      orderBy: { innings: { match: { startTime: 'desc' } } },
      include: { innings: { include: { match: { include: { team1: true, team2: true } } } } }
    });

    // 4. Aggregate Heatmap Data from raw Immutable Event Stream
    const runEvents: any[] = await prisma.$queryRaw`
      SELECT "payload"->>'shotArea' as "shotArea", "payload"->>'runs' as "runs"
      FROM "Event"
      WHERE "eventType" = 'RUN_SCORED' 
      AND "payload"->>'batsmanId' = ${playerId}
      AND "payload"->>'shotArea' IS NOT NULL
    `;

    const shotDistribution: Record<string, number> = {};
    runEvents.forEach(e => {
        const area = e.shotArea;
        const r = parseInt(e.runs) || 0;
        if (!shotDistribution[area]) shotDistribution[area] = 0;
        shotDistribution[area] += r;
    });

    const dismissalEvents: any[] = await prisma.$queryRaw`
      SELECT "payload"->>'wicketType' as "type"
      FROM "Event"
      WHERE "eventType" = 'WICKET_FELL' 
      AND "payload"->>'batsmanId' = ${playerId}
    `;

    const dismissals: Record<string, number> = {};
    dismissalEvents.forEach(e => {
        const type = e.type || 'UNKNOWN';
        if (!dismissals[type]) dismissals[type] = 0;
        dismissals[type] += 1;
    });

    return {
      career: career || { runs: 0, ballsFaced: 0, fours: 0, sixes: 0, wickets: 0, runsConceded: 0, ballsBowled: 0, maidenOvers: 0 },
      shotDistribution: Object.entries(shotDistribution).map(([name, value]) => ({ name, value })),
      dismissalTypes: Object.entries(dismissals).map(([name, value]) => ({ name, value })),
      recentBatting: recentBatting.map((b: any) => ({
        matchName: `${b.innings.match.team1.shortName || b.innings.match.team1.name} vs ${b.innings.match.team2.shortName || b.innings.match.team2.name}`,
        date: b.innings.match.startTime,
        runs: b.runs,
        balls: b.balls,
        strikeRate: b.strikeRate,
        isOut: b.isOut
      })),
      recentBowling: recentBowling.map((b: any) => ({
        matchName: `${b.innings.match.team1.shortName || b.innings.match.team1.name} vs ${b.innings.match.team2.shortName || b.innings.match.team2.name}`,
        date: b.innings.match.startTime,
        overs: b.overs,
        runs: b.runs,
        wickets: b.wickets,
        economy: b.economy
      }))
    };
  }
}


export default PlayerService;
