// Request Validation Schemas (Zod)
// Strict validation for all API routes

import { z } from 'zod';

// ============================================
// COMMON SCHEMAS
// ============================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const dateRangeSchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
}).refine((data) => {
  if (data.fromDate && data.toDate) {
    return data.fromDate <= data.toDate;
  }
  return true;
}, {
  message: 'fromDate must be before or equal to toDate',
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// MATCH SCHEMAS
// ============================================

export const createMatchSchema = z.object({
  team1Id: uuidSchema,
  team2: z.string().min(1, 'Team 2 is required'), // Can be team ID or name for new team
  venue: z.string().min(1, 'Venue is required'),
  startTime: z.coerce.date(),
  format: z.enum(['T20', 'ODI', 'TEST', 'T10', 'CUSTOM']),
  overs: z.coerce.number().int().min(1).max(50),
  gullyRules: z.record(z.boolean()).optional(),
  tournamentId: uuidSchema.optional(),
});

export const updateMatchSchema = z.object({
  status: z.enum(['CREATED', 'LIVE', 'INNINGS_BREAK', 'COMPLETED', 'ABANDONED']).optional(),
  team1Id: z.string().uuid().optional(),
  team2Id: z.string().uuid().optional(),
  venue: z.string().min(3).optional(),
  startTime: z.string().datetime().optional(),
  currentOver: z.number().min(0).optional(),
  currentBall: z.number().min(0).max(6).optional(),
  currentSnapshot: z.object({
    innings: z.number().optional(),
    target: z.number().nullable().optional(),
    strikerId: z.string().nullable().optional(),
    nonStrikerId: z.string().nullable().optional(),
    bowlerId: z.string().nullable().optional()
  }).optional()
});

export const tossSchema = z.object({
  winnerTeamId: uuidSchema,
  decision: z.enum(['BAT', 'BOWL']),
});

export const matchQuerySchema = paginationSchema.extend({
  status: z.array(z.enum(['CREATED', 'LIVE', 'COMPLETED', 'ABANDONED'])).optional(),
  teamId: uuidSchema.optional(),
  tournamentId: uuidSchema.optional(),
  format: z.enum(['T20', 'ODI', 'TEST', 'T10', 'CUSTOM']).optional(),
});

// ============================================
// EVENT SCHEMAS
// ============================================

export const eventMetadataSchema = z.object({
  source: z.enum(['web', 'mobile', 'api']).default('api'),
  deviceInfo: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).optional();

export const baseEventSchema = z.object({
  id: z.string().uuid('Event ID must be a valid UUID'), // Client-generated for idempotency
  matchId: uuidSchema,
  metadata: eventMetadataSchema,
});

export const createBallBowledEventSchema = baseEventSchema.extend({
  eventType: z.literal('BALL_BOWLED'),
  bowlerId: uuidSchema,
  batsmanId: uuidSchema,
  ballType: z.enum(['NORMAL', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE']),
  runs: z.coerce.number().int().min(0).max(7),
  isExtra: z.boolean().default(false),
  commentary: z.string().max(500).optional(),
});

export const createRunScoredEventSchema = baseEventSchema.extend({
  eventType: z.literal('RUN_SCORED'),
  runs: z.coerce.number().int().min(0).max(6),
  batsmanId: uuidSchema,
  bowlerId: uuidSchema,
  isByes: z.boolean().default(false),
  isLegByes: z.boolean().default(false),
});

export const createWicketEventSchema = baseEventSchema.extend({
  eventType: z.literal('WICKET_FELL'),
  batsmanId: uuidSchema,
  bowlerId: uuidSchema,
  wicketType: z.enum(['BOWLED', 'CAUGHT', 'LBW', 'STUMPED', 'RUN_OUT', 'HIT_WICKET', 'HANDLED_BALL', 'TIMED_OUT']),
  dismissalMode: z.enum(['BATSMAN_OUT', 'RETIRED_HURT', 'NOT_OUT']),
  fielderId: uuidSchema.optional(),
});

export const createDisputeEventSchema = baseEventSchema.extend({
  eventType: z.literal('DISPUTE_FLAGGED'),
  eventId: z.string().uuid(), // The event being disputed
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
});

export const createEventSchema = z.discriminatedUnion('eventType', [
  createBallBowledEventSchema,
  createRunScoredEventSchema,
  createWicketEventSchema,
  createDisputeEventSchema,
]);

// Union of all event creation schemas for POST /events endpoint
export const eventCreationSchema = z.object({
  id: z.string().uuid('Event ID must be a valid UUID for idempotency'),
  matchId: uuidSchema,
  eventType: z.enum([
    'BALL_BOWLED',
    'RUN_SCORED',
    'WICKET_FELL',
    'WIDE_BALL',
    'NO_BALL',
    'BYE',
    'LEG_BYE',
    'OVER_COMPLETED',
    'DISPUTE_FLAGGED',
    'MATCH_STARTED',
    'MATCH_PAUSED',
    'MATCH_RESUMED',
    'TOSS_COMPLETED',
    'INNINGS_STARTED',
    'INNINGS_COMPLETED',
  ]),
  payload: z.record(z.unknown()),
  overNumber: z.coerce.number().int().min(0),
  ballNumber: z.coerce.number().int().min(0).max(6),
  metadata: z.object({
    source: z.enum(['web', 'mobile', 'api']).default('api'),
    deviceInfo: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }).optional(),
});

// ============================================
// TOURNAMENT SCHEMAS
// ============================================

export const createTournamentSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters').max(200),
  description: z.string().max(2000).optional(),
  format: z.enum(['T20', 'ODI', 'TEST', 'T10', 'CUSTOM']),
  overs: z.coerce.number().int().min(1).max(50),
  maxOversPerBowler: z.coerce.number().int().min(1).max(10).optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationDeadline: z.coerce.date().optional(),
  maxTeams: z.coerce.number().int().min(2).max(100),
  minTeams: z.coerce.number().int().min(2).max(100).default(2),
  venue: z.string().optional(),
  prizeMoney: z.string().optional(),
  rules: z.object({
    winPoints: z.number().int().default(2),
    tiePoints: z.number().int().default(1),
    lossPoints: z.number().int().default(0),
    noResultPoints: z.number().int().default(1),
    superOver: z.boolean().default(true),
    DuckworthLewis: z.boolean().default(false),
  }).optional(),
});

export const updateTournamentSchema = z.object({
  name: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  venue: z.string().optional(),
  prizeMoney: z.string().optional(),
});

export const tournamentQuerySchema = paginationSchema.extend({
  status: z.array(z.enum(['DRAFT', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])).optional(),
  format: z.enum(['T20', 'ODI', 'TEST', 'T10', 'CUSTOM']).optional(),
  organizerId: uuidSchema.optional(),
});

// ============================================
// TEAM SCHEMAS
// ============================================

export const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  shortName: z.string().min(2).max(10).optional(),
  logoUrl: z.string().url().optional(),
  homeGround: z.string().max(200).optional(),
});

export const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  shortName: z.string().min(2).max(10).optional(),
  logoUrl: z.string().url().optional(),
  homeGround: z.string().max(200).optional(),
  captainId: uuidSchema.nullable().optional(),
  viceCaptainId: uuidSchema.nullable().optional(),
  coachId: uuidSchema.nullable().optional(),
});

export const teamQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const addPlayerToSquadSchema = z.object({
  playerId: uuidSchema,
});

// ============================================
// PLAYER SCHEMAS
// ============================================

export const createPlayerSchema = z.object({
  name: z.string().min(2, 'Player name must be at least 2 characters').max(100),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  dateOfBirth: z.coerce.date().optional(),
  battingStyle: z.enum(['RIGHT_HANDED', 'LEFT_HANDED']).optional(),
  bowlingStyle: z.enum([
    'RIGHT_ARM_FAST',
    'RIGHT_ARM_MEDIUM_FAST',
    'RIGHT_ARM_MEDIUM',
    'RIGHT_ARM_OFF_SPIN',
    'RIGHT_ARM_LEG_SPIN',
    'LEFT_ARM_FAST',
    'LEFT_ARM_MEDIUM_FAST',
    'LEFT_ARM_SPIN',
    'CHINAMAN',
    'LEG_BREAK',
    'OFF_BREAK',
    'GOOGLY',
  ]).optional(),
  role: z.enum(['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER', 'WICKET_KEEPER_BATSMAN']),
  teamId: uuidSchema.optional(),
  jerseyNumber: z.coerce.number().int().min(0).max(999).optional(),
});

export const updatePlayerSchema = createPlayerSchema.partial();

export const playerQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
  teamId: uuidSchema.optional(),
});

// ============================================
// VALIDATION MIDDLEWARE
// ============================================

import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { ValidationError } from '../middleware/error.middleware.js';

/**
 * Create a validation hook for request body
 */
export function validateBody<T extends z.ZodSchema>(schema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Invalid request body', errors);
    }

    request.body = result.data;
  };
}

/**
 * Create a validation hook for query parameters
 */
export function validateQuery<T extends z.ZodSchema>(schema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const result = schema.safeParse(request.query);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Invalid query parameters', errors);
    }

    request.query = result.data;
  };
}

/**
 * Create a validation hook for route parameters
 */
export function validateParams<T extends z.ZodSchema>(schema: T) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    const result = schema.safeParse(request.params);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      throw new ValidationError('Invalid route parameters', errors);
    }

    (request as any).params = result.data;
  };
}

// ============================================
// TYPE EXPORTS
// ============================================

export type Pagination = z.infer<typeof paginationSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type TossInput = z.infer<typeof tossSchema>;
export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;
export type CreateEventInput = z.infer<typeof eventCreationSchema>;
