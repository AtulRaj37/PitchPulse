// Team Routes
// Handles /api/teams endpoints

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import TeamService from './team.service.js';
import {
  createTeamSchema,
  updateTeamSchema,
  teamQuerySchema,
  uuidSchema,
  addPlayerToSquadSchema,
  validateBody,
  validateQuery,
} from '../../core/validation/schemas.js';
import { verifyToken } from '../../core/middleware/auth.middleware.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export async function teamRoutes(fastify: FastifyInstance): Promise<void> {
  // Use authentication for most routes
  
  /**
   * POST /teams
   * Create a new team
   */
  fastify.post('/', {
    preHandler: [verifyToken, validateBody(createTeamSchema)],
    schema: {
      description: 'Create a team',
      tags: ['teams'],
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    const body = request.body as { name: string; shortName?: string; logoUrl?: string; };

    const team = await TeamService.createTeam({
      ...body,
      createdBy: user.userId,
    });

    reply.status(201).send({
      success: true,
      data: team,
    });
  }));

  /**
   * GET /teams
   * List teams
   */
  fastify.get('/', {
    preHandler: validateQuery(teamQuerySchema),
    schema: { description: 'List teams', tags: ['teams'] },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    const result = await TeamService.listTeams(query);

    reply.send({
      success: true,
      data: result.teams,
      meta: { total: result.total, limit: query.limit, offset: query.offset },
    });
  }));

  /**
   * GET /teams/:id
   * Get team
   */
  fastify.get('/:id', {
    schema: { description: 'Get team details', tags: ['teams'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const match = await TeamService.getTeamById(request.params.id);
    reply.send({
      success: true,
      data: match,
    });
  }));

  /**
   * PATCH /teams/:id
   * Update team
   */
  fastify.patch('/:id', {
    preHandler: [verifyToken, validateBody(updateTeamSchema)],
    schema: { description: 'Update team', tags: ['teams'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const updated = await TeamService.updateTeam(request.params.id, request.body as any);
    reply.send({
      success: true,
      data: updated,
    });
  }));

  /**
   * DELETE /teams/:id
   * Delete team
   */
  fastify.delete('/:id', {
    preHandler: verifyToken,
    schema: { description: 'Delete team', tags: ['teams'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    await TeamService.deleteTeam(request.params.id);
    reply.send({
      success: true,
      data: { message: 'Team deleted successfully' },
    });
  }));

  /**
   * POST /teams/:id/players
   * Add player to squad
   */
  fastify.post('/:id/players', {
    preHandler: [verifyToken, validateBody(addPlayerToSquadSchema)],
    schema: { description: 'Add player to team squad', tags: ['teams'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const body = request.body as { playerId: string };
    const result = await TeamService.addPlayerToSquad(request.params.id, body.playerId);
    
    reply.send({
      success: true,
      data: result,
    });
  }));

  /**
   * DELETE /teams/:id/players/:playerId
   * Remove player from squad
   */
  fastify.delete('/:id/players/:playerId', {
    preHandler: verifyToken,
    schema: { description: 'Remove player from team squad', tags: ['teams'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string; playerId: string } }>, reply: FastifyReply) => {
    const result = await TeamService.removePlayerFromSquad(request.params.id, request.params.playerId);
    
    reply.send({
      success: true,
      data: { message: 'Player removed from squad successfully' },
    });
  }));

  /**
   * GET /teams/:id/squad
   * Get team squad
   */
  fastify.get('/:id/squad', {
    schema: { description: 'Get team squad', tags: ['teams'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const squad = await TeamService.getSquad(request.params.id);
    
    reply.send({
      success: true,
      data: squad,
    });
  }));
}

export default teamRoutes;
