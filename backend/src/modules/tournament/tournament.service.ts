// Tournament Service
// Handles tournament operations including fixtures and points tables

import { prisma } from '../../core/db/prisma.js';
import { AppError, NotFoundError } from '../../core/middleware/error.middleware.js';

export class TournamentService {
  /**
   * Create Tournament
   */
  static async createTournament(data: any) {
    return prisma.tournament.create({
      data,
    });
  }

  /**
   * Get Tournament
   */
  static async getTournamentById(id: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: { include: { team: true } },
        fixtures: { include: { team1: true, team2: true }, orderBy: { matchNumber: 'asc' } },
      },
    });

    if (!tournament) throw new NotFoundError('Tournament', id);
    return tournament;
  }

  /**
   * List Tournaments
   */
  static async listTournaments(query: { limit?: number; offset?: number; status?: string[]; organizerId?: string }) {
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    
    const where: any = {};
    if (query.status && query.status.length > 0) where.status = { in: query.status };
    if (query.organizerId) where.organizerId = query.organizerId;

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.tournament.count({ where }),
    ]);

    return { tournaments, total };
  }

  /**
   * Add team to tournament
   */
  static async addTeam(tournamentId: string, teamId: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) throw new NotFoundError('Tournament', tournamentId);
    
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundError('Team', teamId);

    return prisma.tournamentTeam.create({
      data: { tournamentId, teamId },
    });
  }

  /**
   * Generate Fixtures
   */
  static async generateFixtures(tournamentId: string, format: 'round-robin' | 'knockout' | 'group + knockout') {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: true },
    });

    if (!tournament) throw new NotFoundError('Tournament', tournamentId);

    const teamIds = tournament.teams.map((t: any) => t.teamId);
    if (teamIds.length < 2) throw new AppError('Not enough teams to generate fixtures', 'INVALID_OPERATION', 400);

    // Delete existing unplayed fixtures
    await prisma.fixture.deleteMany({
      where: { tournamentId, status: 'TBD' }
    });

    const fixtures: any[] = [];

    if (format === 'round-robin') {
      let matchNum = 1;
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          fixtures.push({
            tournamentId,
            round: 1,
            matchNumber: matchNum++,
            team1Id: teamIds[i],
            team2Id: teamIds[j],
            status: 'TBD'
          });
        }
      }
    } else if (format === 'knockout') {
      // Simple single-elimination representation (assuming power of 2 for simplicity, else byes needed logically)
      let matchNum = 1;
      const numMatches = Math.floor(teamIds.length / 2);
      for (let i = 0; i < numMatches; i++) {
        fixtures.push({
          tournamentId,
          round: 1,
          matchNumber: matchNum++,
          team1Id: teamIds[i * 2],
          team2Id: teamIds[i * 2 + 1],
          status: 'TBD'
        });
      }
    } else {
      throw new AppError('Format not fully supported yet', 'NOT_IMPLEMENTED', 501);
    }

    if (fixtures.length > 0) {
      await prisma.fixture.createMany({ data: fixtures });
    }

    return { message: `${fixtures.length} fixtures generated.`, format };
  }

  /**
   * Add Quick Custom Fixture
   */
  static async addFixture(tournamentId: string, team1Id: string, team2Id: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { fixtures: true },
    });
    if (!tournament) throw new NotFoundError('Tournament', tournamentId);
    
    const existingFixtures = tournament.fixtures;
    const maxMatchNumber = existingFixtures.length > 0 ? Math.max(...existingFixtures.map(f => f.matchNumber)) : 0;
    
    return prisma.fixture.create({
      data: {
        tournamentId,
        team1Id,
        team2Id,
        round: 1,
        matchNumber: maxMatchNumber + 1,
        status: 'TBD'
      }
    });
  }

  /**
   * Get dynamic Points Table
   * Computed based on matches in the tournament
   */
  static async getPointsTable(tournamentId: string) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { teams: { include: { team: true } } },
    });
    
    if (!tournament) throw new NotFoundError('Tournament', tournamentId);

    const matchRecords = await prisma.match.findMany({
      where: { tournamentId, status: 'COMPLETED' },
      include: { scorecard: true },
    });

    // Compute stats per team logically based on actual Match schema
    const rules: any = tournament.rules || { winPoints: 2, tiePoints: 1, noResultPoints: 1 };
    
    const table: Record<string, any> = {};
    for (const tt of tournament.teams) {
      table[tt.teamId] = {
        teamId: tt.teamId,
        teamName: tt.team.name,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        noResult: 0,
        points: 0,
        netRunRate: 0,
      };
    }

    matchRecords.forEach(match => {
      // Determine winner safely for demonstration mapping
      // Real implementation would look deeply at scorecard
      const sc: any = match.scorecard?.matchResult || {};
      const winnerId = sc.winnerTeamId || null;
      const t1 = match.team1Id;
      const t2 = match.team2Id;

      if (table[t1]) table[t1].played += 1;
      if (table[t2]) table[t2].played += 1;

      if (winnerId) {
        if (winnerId === t1) {
          if (table[t1]) { table[t1].won += 1; table[t1].points += rules.winPoints; }
          if (table[t2]) table[t2].lost += 1;
        } else if (winnerId === t2) {
          if (table[t2]) { table[t2].won += 1; table[t2].points += rules.winPoints; }
          if (table[t1]) table[t1].lost += 1;
        }
      } else {
        // Tie or No Result
        if (table[t1]) { table[t1].noResult += 1; table[t1].points += rules.noResultPoints; }
        if (table[t2]) { table[t2].noResult += 1; table[t2].points += rules.noResultPoints; }
      }
    });

    const results = Object.values(table).sort((a: any, b: any) => b.points - a.points || b.netRunRate - a.netRunRate);
    return results;
  }

  /**
   * Update Tournament
   */
  static async updateTournament(id: string, data: any) {
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw new NotFoundError('Tournament', id);
    return prisma.tournament.update({ where: { id }, data });
  }

  /**
   * Delete Tournament
   */
  static async deleteTournament(id: string) {
    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) throw new NotFoundError('Tournament', id);
    
    // Prisma cascading or manual deletion might be needed for relations
    // Assuming schema cascades, otherwise we must delete relations first
    return prisma.tournament.delete({ where: { id } });
  }
}

export default TournamentService;
