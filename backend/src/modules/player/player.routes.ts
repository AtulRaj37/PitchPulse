// Player Routes
// Handles /api/players endpoints

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import PlayerService from './player.service.js';
import {
  createPlayerSchema,
  updatePlayerSchema,
  playerQuerySchema,
  paginationSchema,
  validateBody,
  validateQuery,
} from '../../core/validation/schemas.js';
import { verifyToken, requireRole } from '../../core/middleware/auth.middleware.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export async function playerRoutes(fastify: FastifyInstance): Promise<void> {

  /**
   * POST /players
   * Create a new player
   */
  fastify.post('/', {
    preHandler: [verifyToken, validateBody(createPlayerSchema)],
    schema: { description: 'Create a player', tags: ['players'] },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const player = await PlayerService.createPlayer(body);

    reply.status(201).send({
      success: true,
      data: player,
    });
  }));

  /**
   * GET /players
   * List players (with search and team filtering)
   */
  fastify.get('/', {
    preHandler: validateQuery(playerQuerySchema),
    schema: { description: 'List players with search', tags: ['players'] },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const result = await PlayerService.listPlayers(query);

    reply.send({
      success: true,
      data: result.players,
      meta: { total: result.total, limit: query.limit, offset: query.offset },
    });
  }));

  /**
   * GET /players/:id
   * Get player
   */
  fastify.get('/:id', {
    schema: { description: 'Get player details', tags: ['players'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const player = await PlayerService.getPlayerById(request.params.id);
    reply.send({
      success: true,
      data: player,
    });
  }));

  /**
   * PATCH /players/:id
   * Update player details
   */
  fastify.patch('/:id', {
    preHandler: [verifyToken, validateBody(updatePlayerSchema)],
    schema: { description: 'Update player', tags: ['players'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const updated = await PlayerService.updatePlayer(request.params.id, request.body as any);
    reply.send({
      success: true,
      data: updated,
    });
  }));

  /**
   * GET /players/:id/matches
   * Get match history for a player
   */
  fastify.get('/:id/matches', {
    preHandler: validateQuery(paginationSchema),
    schema: { description: 'Get player match history', tags: ['players'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const query = request.query as any;
    const result = await PlayerService.getMatchHistory(request.params.id, query);
    
    reply.send({
      success: true,
      data: result.matches,
      meta: { total: result.total, limit: query.limit, offset: query.offset },
    });
  }));
}

export default playerRoutes;
