// Fastify Application
// Main application setup with plugins, rate limiting, and request tracking

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config/index.js';
import authPlugin from './core/middleware/auth.middleware.js';
import errorPlugin, { AppError } from './core/middleware/error.middleware.js';
import logger from './shared/utils/logger.js';

import authRoutes from './modules/auth/auth.routes.js';
import matchRoutes from './modules/match/match.routes.js';
import commandRoutes from './modules/command/command.routes.js';
import teamRoutes from './modules/team/team.routes.js';
import playerRoutes from './modules/player/player.routes.js';
import tournamentRoutes from './modules/tournament/tournament.routes.js';
import statsRoutes from './modules/stats/stats.routes.js';

// ============================================
// REQUEST ID PLUGIN
// ============================================

async function requestIdPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('onRequest', async (request) => {
    // Generate request ID if not provided
    if (!request.id) {
      request.id = generateRequestId();
    }

    // Add request ID to log context
    request.log = request.log.child({ requestId: request.id });
  });

  fastify.addHook('onResponse', async (request, reply) => {
    // Log request completion
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: reply.elapsedTime,
    });
  });
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================
// RATE LIMITING CONFIG
// ============================================

const rateLimitConfig = {
  // Default rate limit for general APIs
  global: {
    max: config.server.isProd ? 100 : 500,
    timeWindow: '1 minute',
  },
  // Stricter limits for event creation
  eventCreation: {
    max: config.server.isProd ? 30 : 100,
    timeWindow: '1 minute',
  },
  // Very strict limits for scoring (ball by ball)
  scoring: {
    max: config.server.isProd ? 10 : 30,
    timeWindow: '1 minute',
  },
  // Auth endpoints
  auth: {
    max: 5,
    timeWindow: '1 minute',
  },
};

// ============================================
// APP FACTORY
// ============================================

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: config.logging.level,
      transport:
        config.server.isDev
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
              },
            }
          : undefined,
    },
    disableRequestLogging: true, // We handle logging in hooks
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    trustProxy: true,
  });

  // ============================================
  // REQUEST ID TRACKING
  // ============================================

  await app.register(requestIdPlugin);

  // ============================================
  // PLUGINS
  // ============================================

  // CORS
  await app.register(cors, {
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'],
    maxAge: 86400,
  });

  // Security headers
  await app.register(helmet, {
    contentSecurityPolicy: config.server.isProd,
    crossOriginEmbedderPolicy: config.server.isProd,
  });

  // Global rate limiting
  await app.register(rateLimit, {
    max: rateLimitConfig.global.max,
    timeWindow: rateLimitConfig.global.timeWindow,
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        retryAfter: Math.ceil(context.ttl / 1000),
      },
    }),
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  // Authentication plugin
  await app.register(authPlugin);

  // Error handling plugin
  await app.register(errorPlugin);

  // ============================================
  // HEALTH CHECKS
  // ============================================

  await app.get('/health', async (request) => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.server.env,
    requestId: request.id,
  }));

  await app.get('/ready', async (request, reply) => {
    const checks: Record<string, boolean> = {};

    try {
      const { ping: dbPing } = await import('./core/db/prisma.js');
      checks.database = await dbPing();
    } catch {
      checks.database = false;
    }

    try {
      const { ping: redisPing } = await import('./core/redis/redis.js');
      checks.redis = await redisPing();
    } catch {
      checks.redis = false;
    }

    const allHealthy = Object.values(checks).every(Boolean);

    return reply.status(allHealthy ? 200 : 503).send({
      status: allHealthy ? 'ready' : 'not_ready',
      checks,
      timestamp: new Date().toISOString(),
      requestId: request.id,
    });
  });

  // Rate limit status endpoint
  await app.get('/rate-limit-status', async (request) => {
    return {
      global: rateLimitConfig.global,
      eventCreation: rateLimitConfig.eventCreation,
      scoring: rateLimitConfig.scoring,
      auth: rateLimitConfig.auth,
    };
  });

  // ============================================
  // API ROUTES
  // ============================================

  // Root API info
  await app.get('/api', async (request) => ({
    name: 'PitchPulse API',
    version: '1.0.0',
    documentation: '/api/docs',
    requestId: request.id,
  }));

  // Register auth routes
  await app.register(authRoutes, { prefix: '/api/auth' });

  // Register match routes
  await app.register(matchRoutes, { prefix: '/api/matches' });

  // Register command routes (scoring commands with stricter rate limiting)
  await app.register(commandRoutes, { prefix: '/api/commands' });

  // Register team routes
  await app.register(teamRoutes, { prefix: '/api/teams' });

  // Register player routes
  await app.register(playerRoutes, { prefix: '/api/players' });

  // Register tournament routes
  await app.register(tournamentRoutes, { prefix: '/api/tournaments' });

  // Register stats routes
  await app.register(statsRoutes, { prefix: '/api/stats' });

  // ============================================
  // GRACEFUL SHUTDOWN
  // ============================================

  const shutdown = async (signal: string): Promise<void> => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);

    try {
      await app.close();
      logger.info('HTTP server closed');

      const { disconnect: disconnectDb } = await import('./core/db/prisma.js');
      await disconnectDb();
      logger.info('Database disconnected');

      const { disconnect: disconnectRedis } = await import('./core/redis/redis.js');
      await disconnectRedis();
      logger.info('Redis disconnected');

      try {
        const { disconnectSocketServer } = await import('./core/websocket/socket-server.js');
        await disconnectSocketServer();
        logger.info('Socket.IO disconnected');
      } catch {
        // Socket might not be initialized
      }

      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return app;
}

// ============================================
// RATE LIMIT HELPERS
// ============================================

export function getRateLimitConfig() {
  return rateLimitConfig;
}

export { rateLimitConfig };

export default buildApp;
