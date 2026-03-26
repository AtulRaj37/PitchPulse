// Stats Routes
// Handles /api/stats endpoints

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import StatsService from './stats.service.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { z } from 'zod';

const leaderboardQuerySchema = z.object({
  type: z.enum(['runs', 'wickets']),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function statsRoutes(fastify: FastifyInstance): Promise<void> {

  /**
   * GET /stats/leaderboard
   * Get global or tournament leaderboard
   */
  fastify.get('/leaderboard', {
    schema: { description: 'Get global leaderboards', tags: ['stats'] },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = leaderboardQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      reply.status(400).send({ success: false, error: 'Invalid query type' });
      return;
    }
    const query = parseResult.data;
    
    const data = await StatsService.getLeaderboard(query.type, query.limit);

    reply.send({
      success: true,
      data,
    });
  }));

  /**
   * GET /stats/matches/:id/analytics
   * Get detailed match analytics
   */
  fastify.get('/matches/:id/analytics', {
    schema: { description: 'Get match analytics', tags: ['stats'] },
  }, asyncHandler(async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const data = await StatsService.getMatchAnalytics(request.params.id);
    reply.send({
      success: true,
      data,
    });
  }));
}

export default statsRoutes;
