// Match Routes
// Match CRUD endpoints with validation

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import matchService from './match.service.js';
import {
  createMatchSchema,
  updateMatchSchema,
  matchQuerySchema,
  validateBody,
  validateQuery,
  validateParams,
  uuidSchema,
} from '../../core/validation/schemas.js';
import { z } from 'zod';
import { verifyToken } from '../../core/middleware/auth.middleware.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { AppError } from '../../core/middleware/error.middleware.js';

// ============================================
// ROUTES
// ============================================

export async function matchRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /matches
   * Create a new match
   */
  fastify.post('/', {
    preHandler: [verifyToken, validateBody(createMatchSchema)],
    schema: {
      description: 'Create a new match',
      tags: ['matches'],
      security: [{ bearerAuth: [] }],
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AppError('Not authenticated', 'NOT_AUTHENTICATED', 401);
    }

    const body = request.body as {
      team1Id: string;
      team2: string;  // Can be team ID or name
      venue: string;
      startTime: Date;
      format: string;
      overs: number;
      gullyRules?: Record<string, boolean>;
      tournamentId?: string;
    };

    const match = await matchService.createMatch({
      team1Id: body.team1Id,
      team2Id: body.team2,  // Bridge: schema field `team2` → service field `team2Id`
      venue: body.venue,
      startTime: body.startTime,
      format: body.format,
      overs: body.overs,
      gullyRules: body.gullyRules,
      tournamentId: body.tournamentId,
      createdBy: request.user.userId,
    });

    reply.status(201).send({
      success: true,
      data: match,
    });
  }));

  /**
   * GET /matches
   * List matches
   */
  fastify.get('/', {
    preHandler: validateQuery(matchQuerySchema),
    schema: {
      description: 'List matches',
      tags: ['matches'],
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as {
      limit?: number;
      offset?: number;
      status?: string[];
      teamId?: string;
      tournamentId?: string;
    };

    const result = await matchService.listMatches(query);

    reply.send({
      success: true,
      data: result.matches,
      meta: {
        total: result.total,
        limit: query.limit,
        offset: query.offset,
      },
    });
  }));

  /**
   * GET /matches/:id
   * Get match by ID
   */
  fastify.get('/:id', {
    preHandler: validateParams(z.object({ id: uuidSchema })),
    schema: {
      description: 'Get match by ID',
      tags: ['matches'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const match = await matchService.getMatchById(request.params.id);

    reply.send({
      success: true,
      data: match,
    });
  }));

  /**
   * PATCH /matches/:id
   * Update match
   */
  fastify.patch('/:id', {
    preHandler: [validateBody(updateMatchSchema)],
    schema: {
      description: 'Update match',
      tags: ['matches'],
      security: [{ bearerAuth: [] }],
    },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await matchService.updateMatch(request.params.id, request.body as {
      status?: string;
      venue?: string;
      startTime?: Date;
      currentOver?: number;
      currentBall?: number;
    });

    reply.send({
      success: true,
      data: { message: 'Match updated successfully' },
    });
  }));

  /**
   * PATCH /matches/:id/schedule
   * Schedule match
   */
  fastify.patch('/:id/schedule', {
    preHandler: [verifyToken], // Ideally requireRole('ADMIN', 'ORGANIZER')
    schema: {
      description: 'Schedule a match',
      tags: ['matches'],
      security: [{ bearerAuth: [] }],
    },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const body = request.body as { startTime: string; venue?: string };
    
    await matchService.updateMatch(request.params.id, {
      startTime: new Date(body.startTime),
      venue: body.venue,
    });

    reply.send({
      success: true,
      data: { message: 'Match scheduled successfully' },
    });
  }));

  /**
   * DELETE /matches/:id
   * Delete match
   */
  fastify.delete('/:id', {
    preHandler: [],
    schema: {
      description: 'Delete match',
      tags: ['matches'],
      security: [{ bearerAuth: [] }],
    },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await matchService.deleteMatch(request.params.id);

    reply.send({
      success: true,
      data: { message: 'Match deleted successfully' },
    });
  }));
}

export default matchRoutes;
