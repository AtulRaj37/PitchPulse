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
      include: { scorecard: true, innings: true },
    });

    const rules: any = tournament.rules || { winPoints: 2, tiePoints: 1, noResultPoints: 1 };
    
    // Helper to process Cricket overs syntax (1.4 overs = 10 balls)
    const oversToBalls = (oversFloat: number) => {
      const fullOvers = Math.floor(oversFloat);
      const balls = Math.round((oversFloat - fullOvers) * 10);
      return (fullOvers * 6) + balls;
    };
    
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
        runsScored: 0,
        ballsFaced: 0,
        runsConceded: 0,
        ballsBowled: 0,
        netRunRate: 0,
      };
    }

    matchRecords.forEach(match => {
      const sc: any = match.scorecard?.matchResult || {};
      const winnerId = sc.winnerTeamId || null;
      const t1 = match.team1Id;
      const t2 = match.team2Id;

      const hasResult = winnerId || sc.result === 'TIE' || sc.result === 'NO_RESULT';

      if (hasResult) {
        if (table[t1]) table[t1].played += 1;
        if (table[t2]) table[t2].played += 1;

        if (winnerId && winnerId !== 'TIE' && winnerId !== 'NO_RESULT') {
          if (winnerId === t1) {
            if (table[t1]) { table[t1].won += 1; table[t1].points += rules.winPoints; }
            if (table[t2]) table[t2].lost += 1;
          } else if (winnerId === t2) {
            if (table[t2]) { table[t2].won += 1; table[t2].points += rules.winPoints; }
            if (table[t1]) table[t1].lost += 1;
          }
        } else if (sc.result === 'TIE' || winnerId === 'TIE') {
          if (table[t1]) { table[t1].tied += 1; table[t1].points += rules.tiePoints; }
          if (table[t2]) { table[t2].tied += 1; table[t2].points += rules.tiePoints; }
        } else if (sc.result === 'NO_RESULT') {
          if (table[t1]) { table[t1].noResult += 1; table[t1].points += rules.noResultPoints; }
          if (table[t2]) { table[t2].noResult += 1; table[t2].points += rules.noResultPoints; }
        }

        // Apply NRR Statistics
        match.innings?.forEach((inn) => {
          const isT1Batting = inn.battingTeamId === t1;
          const isT2Batting = inn.battingTeamId === t2;

          let effectiveBalls = oversToBalls(inn.overs);
          // Standard Cricket Rule: If a team is bowled out, their factored overs is the full quota
          if (inn.totalWickets >= 10) {
            effectiveBalls = match.overs * 6;
          }

          if (isT1Batting && table[t1]) {
            table[t1].runsScored += inn.totalRuns;
            table[t1].ballsFaced += effectiveBalls;
            if (table[t2]) {
               table[t2].runsConceded += inn.totalRuns;
               table[t2].ballsBowled += effectiveBalls;
            }
          }
          if (isT2Batting && table[t2]) {
            table[t2].runsScored += inn.totalRuns;
            table[t2].ballsFaced += effectiveBalls;
            if (table[t1]) {
               table[t1].runsConceded += inn.totalRuns;
               table[t1].ballsBowled += effectiveBalls;
            }
          }
        });
      }
    });

    // Finalize Component Metrics
    Object.values(table).forEach((team: any) => {
      const rsPerOver = team.ballsFaced > 0 ? (team.runsScored / (team.ballsFaced / 6)) : 0;
      const rcPerOver = team.ballsBowled > 0 ? (team.runsConceded / (team.ballsBowled / 6)) : 0;
      team.netRunRate = Number((rsPerOver - rcPerOver).toFixed(3));
    });

    const results = Object.values(table).sort((a: any, b: any) => b.points - a.points || b.netRunRate - a.netRunRate);
    return results;
  }

  /**
   * Get Tournament Leaderboards (Orange Cap, Purple Cap)
   */
  static async getLeaderboards(tournamentId: string, limit: number = 10) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });
    if (!tournament) throw new NotFoundError('Tournament', tournamentId);

    // Get all matches for this tournament
    const matches = await prisma.match.findMany({
      where: { tournamentId, status: 'COMPLETED' },
      select: { id: true }
    });
    const matchIds = matches.map(m => m.id);

    if (matchIds.length === 0) {
      return { topBatsmen: [], topBowlers: [] };
    }

    // Top Batsmen (Orange Cap)
    const battingStats = await prisma.battingStats.findMany({
      where: { innings: { matchId: { in: matchIds } } },
      include: { player: { select: { id: true, name: true, team: { select: { name: true, shortName: true } } } } }
    });

    const batMap: Record<string, any> = {};
    battingStats.forEach(b => {
      if (!batMap[b.playerId]) {
        batMap[b.playerId] = {
           id: b.playerId,
           name: b.player.name,
           teamName: b.player.team?.shortName || b.player.team?.name,
           innings: 0, runs: 0, balls: 0, fours: 0, sixes: 0
        };
      }
      batMap[b.playerId].innings += 1;
      batMap[b.playerId].runs += b.runs;
      batMap[b.playerId].balls += b.balls;
      batMap[b.playerId].fours += b.fours;
      batMap[b.playerId].sixes += b.sixes;
    });

    const topBatsmen = Object.values(batMap)
      .map(p => ({ ...p, strikeRate: p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(2) : '0.00' }))
      .sort((a, b) => b.runs - a.runs || parseFloat(b.strikeRate) - parseFloat(a.strikeRate))
      .slice(0, limit);

    // Top Bowlers (Purple Cap)
    const bowlingStats = await prisma.bowlingStats.findMany({
      where: { innings: { matchId: { in: matchIds } } },
      include: { player: { select: { id: true, name: true, team: { select: { name: true, shortName: true } } } } }
    });

    const bowlMap: Record<string, any> = {};
    bowlingStats.forEach(b => {
      if (!bowlMap[b.playerId]) {
        bowlMap[b.playerId] = {
           id: b.playerId,
           name: b.player.name,
           teamName: b.player.team?.shortName || b.player.team?.name,
           innings: 0, wickets: 0, runs: 0, overs: 0, maidens: 0
        };
      }
      bowlMap[b.playerId].innings += 1;
      bowlMap[b.playerId].wickets += b.wickets;
      bowlMap[b.playerId].runs += b.runs;
      bowlMap[b.playerId].overs += b.overs;
      bowlMap[b.playerId].maidens += b.maidens || 0;
    });

    const topBowlers = Object.values(bowlMap)
      .map((p: any) => {
         const balls = Math.floor(p.overs) * 6 + Math.round((p.overs - Math.floor(p.overs)) * 10);
         const economy = balls > 0 ? (p.runs / (balls / 6)).toFixed(2) : '0.00';
         return { ...p, economy };
      })
      .sort((a: any, b: any) => b.wickets - a.wickets || parseFloat(a.economy) - parseFloat(b.economy))
      .slice(0, limit);

    return { topBatsmen, topBowlers };
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
