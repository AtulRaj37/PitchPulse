// Stats Service
// Handles Leaderboards and Match Analytics

import { prisma } from '../../core/db/prisma.js';
import { NotFoundError } from '../../core/middleware/error.middleware.js';

export class StatsService {
  /**
   * Get Leaderboard
   * @param type 'runs' | 'wickets'
   */
  static async getLeaderboard(type: 'runs' | 'wickets', limit: number = 10) {
    if (type === 'runs') {
      return prisma.playerStats.findMany({
        orderBy: { runs: 'desc' },
        take: limit,
        include: { player: { select: { name: true, avatarUrl: true, teamId: true } } },
      });
    } else {
      return prisma.playerStats.findMany({
        orderBy: { wickets: 'desc' },
        take: limit,
        include: { player: { select: { name: true, avatarUrl: true, teamId: true } } },
      });
    }
  }

  /**
   * Get Match Analytics
   */
  static async getMatchAnalytics(matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        scorecard: true,
        innings: {
          include: {
            battingStats: true,
            bowlingStats: true,
          }
        }
      }
    });

    if (!match) throw new NotFoundError('Match', matchId);

    // Provide some synthetic or aggregated analytics
    // e.g. Run Rate progression, worm graph approximations, partnership data
    const analytics = {
      matchId,
      currentRunRate: 0,
      projectedScore: 0,
      phaseAnalysis: {
        powerplay: { runs: 0, wickets: 0 },
        middleOvers: { runs: 0, wickets: 0 },
        deathOvers: { runs: 0, wickets: 0 }
      },
      topPerformers: {
        batsmen: match.innings.flatMap(i => i.battingStats).sort((a, b) => b.runs - a.runs).slice(0, 3),
        bowlers: match.innings.flatMap(i => i.bowlingStats).sort((a, b) => b.wickets - a.wickets || a.economy - b.economy).slice(0, 3)
      }
    };

    return analytics;
  }
}

export default StatsService;
