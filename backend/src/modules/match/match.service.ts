// Match Service
// Match CRUD operations
// Note: Business logic for scoring will be in event-sourcing module

import { prisma } from '../../core/db/prisma.js';
import { AppError, NotFoundError } from '../../core/middleware/error.middleware.js';
import { matchLogger as logger } from '../../shared/utils/logger.js';

// ============================================
// TYPES
// ============================================

interface CreateMatchInput {
  readonly team1Id: string;
  readonly team2Id: string;
  readonly venue: string;
  readonly startTime: Date;
  readonly format: string;
  readonly overs: number;
  readonly gullyRules?: Record<string, boolean>;
  readonly tournamentId?: string;
  readonly createdBy: string;
}

interface UpdateMatchInput {
  readonly status?: string;
  readonly venue?: string;
  readonly startTime?: Date;
  readonly endTime?: Date;
}

// ============================================
// SERVICE
// ============================================

/**
 * Create a new match
 */
async function createMatch(input: CreateMatchInput): Promise<{
  id: string;
  team1Id: string;
  team2Id: string;
  venue: string;
  startTime: Date;
  status: string;
  format: string;
  overs: number;
  gullyRules?: Record<string, boolean> | null;
}> {
  const { team1Id, team2Id, venue, startTime, format, overs, tournamentId, gullyRules, createdBy } = input;

  // Verify teams exist
  const [team1, team2] = await Promise.all([
    prisma.team.findUnique({ where: { id: team1Id } }),
    prisma.team.findUnique({ where: { id: team2Id } }),
  ]);

  if (!team1 || !team2) {
    throw new NotFoundError('Team');
  }

  // Cannot create match with same team
  if (team1Id === team2Id) {
    throw new AppError('Cannot create match with same team', 'INVALID_MATCH', 400);
  }

  const match = await prisma.match.create({
    data: {
      team1Id,
      team2Id,
      venue,
      startTime,
      format: format as never,
      overs,
      gullyRules: gullyRules ?? undefined,
      tournamentId,
      createdBy,
      status: 'CREATED',
    },
  });

  logger.info({ matchId: match.id, team1Id, team2Id }, 'Match created');

  return {
    id: match.id,
    team1Id: match.team1Id,
    team2Id: match.team2Id,
    venue: match.venue ?? '',
    startTime: match.startTime,
    status: match.status,
    format: match.format,
    overs: match.overs,
    gullyRules: match.gullyRules as any,
  };
}

/**
 * Get match by ID
 */
async function getMatchById(matchId: string): Promise<any> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      team1: { select: { id: true, name: true, logoUrl: true, players: { select: { id: true, name: true, role: true } } } },
      team2: { select: { id: true, name: true, logoUrl: true, players: { select: { id: true, name: true, role: true } } } },
      events: { orderBy: { sequenceNumber: 'asc' } },
      innings: {
        include: {
          battingStats: { 
            include: { player: { select: { id: true, name: true, role: true } } },
            orderBy: { position: 'asc' } 
          } as any,
          bowlingStats: { 
            include: { player: { select: { id: true, name: true, role: true } } },
            orderBy: { updatedAt: 'asc' } 
          } as any
        },
        orderBy: { inningsNumber: 'asc' }
      }
    },
  });

  if (!match) {
    throw new NotFoundError('Match', matchId);
  }

  return match;
}

/**
 * List matches with pagination and filters
 */
async function listMatches(params: {
  limit?: number;
  offset?: number;
  status?: string[];
  teamId?: string;
  tournamentId?: string;
}): Promise<{
  matches: Array<{
    id: string;
    team1: { id: string; name: string; shortName: string | null; logoUrl: string | null };
    team2: { id: string; name: string; shortName: string | null; logoUrl: string | null };
    venue: string;
    startTime: Date;
    status: string;
    format: string;
    overs: number;
  }>;
  total: number;
}> {
  const { limit = 20, offset = 0, status, teamId, tournamentId } = params;

  const where: any = {};

  if (status && status.length > 0) {
    where.status = { in: status };
  }

  if (teamId) {
    where.team1Id = teamId;
    where.team2Id = teamId;
  }

  if (tournamentId) {
    where.tournamentId = tournamentId;
  }

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset,
      include: {
        team1: { select: { id: true, name: true, shortName: true, logoUrl: true } },
        team2: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      },
    }),
    prisma.match.count({ where }),
  ]);

  return {
    matches: matches.map((m: any) => ({
      id: m.id,
      team1: m.team1,
      team2: m.team2,
      venue: m.venue ?? '',
      startTime: m.startTime,
      status: m.status,
      format: m.format,
      overs: m.overs,
    })),
    total,
  };
}

/**
 * Update match
 */
async function updateMatch(matchId: string, input: any): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new NotFoundError('Match', matchId);
  }

  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: input.status,
      venue: input.venue,
      startTime: input.startTime,
      endTime: input.endTime,
      currentSnapshot: input.currentSnapshot ? input.currentSnapshot : undefined
    },
  });

  logger.debug({ matchId }, 'Match updated');
}

/**
 * Delete match (soft delete - change status)
 */
async function deleteMatch(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new NotFoundError('Match', matchId);
  }

  // Hard delete the match unconditionally as per user expectation.
  // Prisma will cascade the deletion to events, innings, match players, and stats due to schema configuration.
  await prisma.match.delete({
    where: { id: matchId },
  });
  logger.info({ matchId }, 'Match hard deleted');
}

export {
  createMatch,
  getMatchById,
  listMatches,
  updateMatch,
  deleteMatch,
};

const matchService = {
  createMatch,
  getMatchById,
  listMatches,
  updateMatch,
  deleteMatch,
};

export default matchService;
