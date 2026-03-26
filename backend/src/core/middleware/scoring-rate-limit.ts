// Scoring Rate Limiter Plugin
// Applies stricter rate limits to scoring endpoints
//
// Use:
// import { scoringRateLimitPlugin } from '../core/middleware/scoring-rate-limit.js';
// await app.register(scoringRateLimitPlugin, { prefix: '/api/commands' });

import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { config } from '../../config/index.js';

const scoringRateLimitConfig = {
  max: config.server.isProd ? 10 : 30, // Very strict for ball-by-ball scoring
  timeWindow: '1 minute',
  keyGenerator: (request: { ip: string; headers: Record<string, string | string[] | undefined> }) => {
    // Use user ID if authenticated, otherwise use IP
    const userId = request.headers['x-user-id'] as string | undefined;
    return userId ?? request.ip;
  },
  errorResponseBuilder: (_request: unknown, context: { ttl: number }) => ({
    success: false,
    error: {
      code: 'SCORING_RATE_LIMIT_EXCEEDED',
      message: `Scoring rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
      retryAfter: Math.ceil(context.ttl / 1000),
    },
  }),
  addHeaders: {
    'x-ratelimit-limit': true,
    'x-ratelimit-remaining': true,
    'x-ratelimit-reset': true,
    'retry-after': true,
  },
};

export async function scoringRateLimitPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(rateLimit, scoringRateLimitConfig);
}

export { scoringRateLimitConfig };
