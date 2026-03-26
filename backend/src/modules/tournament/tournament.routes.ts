// Tournament Routes
// Handles /api/tournaments endpoints

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import TournamentService from './tournament.service.js';
import {
  createTournamentSchema,
  updateTournamentSchema,
  tournamentQuerySchema,
  uuidSchema,
  validateBody,
  validateQuery,
} from '../../core/validation/schemas.js';
import { verifyToken, requireRole } from '../../core/middleware/auth.middleware.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { z } from 'zod';

const generateFixturesSchema = z.object({
  format: z.enum(['round-robin', 'knockout', 'group + knockout']),
});

const addTeamSchema = z.object({
  teamId: uuidSchema,
});

export async function tournamentRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /tournaments
   * Create a new tournament
   */
  fastify.post('/', {
    preHandler: [verifyToken, requireRole('ADMIN', 'ORGANIZER'), validateBody(createTournamentSchema)],
    schema: { description: 'Create a tournament', tags: ['tournaments'] },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const body = request.body as any;

    const tournament = await TournamentService.createTournament({
      ...body,
      organizerId: user.id,
    });

    reply.status(201).send({
      success: true,
      data: tournament,
    });
  }));

  /**
   * GET /tournaments
   * List tournaments
   */
  fastify.get('/', {
    preHandler: validateQuery(tournamentQuerySchema),
    schema: { description: 'List tournaments', tags: ['tournaments'] },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const result = await TournamentService.listTournaments(query);

    reply.send({
      success: true,
      data: result.tournaments,
      meta: { total: result.total, limit: query.limit, offset: query.offset },
    });
  }));

  /**
   * GET /tournaments/:id
   * Get tournament details
   */
  fastify.get('/:id', {
    schema: { description: 'Get tournament details', tags: ['tournaments'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const tournament = await TournamentService.getTournamentById(request.params.id);
    reply.send({
      success: true,
      data: tournament,
    });
  }));

  /**
   * POST /tournaments/:id/teams
   * Register a team for a tournament
   */
  fastify.post('/:id/teams', {
    preHandler: [verifyToken, validateBody(addTeamSchema)],
    schema: { description: 'Add team to tournament', tags: ['tournaments'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const body = request.body as { teamId: string };
    const result = await TournamentService.addTeam(request.params.id, body.teamId);
    
    reply.send({
      success: true,
      data: result,
    });
  }));

  /**
   * POST /tournaments/:id/generate-fixtures
   * Generate fixtures for a tournament
   */
  fastify.post('/:id/generate-fixtures', {
    preHandler: [verifyToken, requireRole('ADMIN', 'ORGANIZER'), validateBody(generateFixturesSchema)],
    schema: { description: 'Generate fixtures for tournament', tags: ['tournaments'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const body = request.body as { format: 'round-robin' | 'knockout' | 'group + knockout' };
    const result = await TournamentService.generateFixtures(request.params.id, body.format);
    
    reply.send({
      success: true,
      data: result,
    });
  }));

  /**
   * GET /tournaments/:id/points-table
   * Get dynamically computed points table
   */
  fastify.get('/:id/points-table', {
    schema: { description: 'Get dynamic points table', tags: ['tournaments'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const result = await TournamentService.getPointsTable(request.params.id);
    reply.send({
      success: true,
      data: result,
    });
  }));
}

export default tournamentRoutes;
