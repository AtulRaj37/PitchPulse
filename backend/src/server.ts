// Server Entry Point
// Starts the Fastify server and Socket.IO

import { createServer } from 'http';
import { config } from './config/index.js';
import { buildApp } from './app.js';
import logger from './shared/utils/logger.js';
import { prisma } from './core/db/prisma.js';
import { redisClient as redis } from './core/redis/redis.js';
import { initializeSocketServer } from './core/websocket/socket-server.js';

async function start(): Promise<void> {
  try {
    // ============================================
    // INITIALIZE CONNECTIONS
    // ============================================

    // Connect to Redis
    if (redis) {
      logger.info('Connecting to Redis...');
      try {
        await redis.connect();
        await redis.ping();
        logger.info('Redis connected successfully');
      } catch (err) {
        logger.warn('Redis connection failed or not provided. Running in standalone mode.');
      }
    } else {
      logger.info('Redis not configured. Running in standalone mode.');
    }

    // Connect to Database
    logger.info('Verifying database connection (Waiting for Neon DB wakeup if asleep)...');
    let dbConnected = false;
    for (let i = 0; i < 5; i++) {
      try {
        await prisma.$connect();
        dbConnected = true;
        logger.info('Database connected successfully!');
        break;
      } catch (err: any) {
        logger.warn(`Database connection attempt ${i + 1} failed. Neon might be waking up. Retrying in 3s...`);
        if (i === 4) throw err;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    // ============================================
    // BUILD FASTIFY APP
    // ============================================

    const app = await buildApp();

    // ============================================
    // INITIALIZE SOCKET.IO
    // ============================================

    logger.info('Initializing Socket.IO server...');
    await initializeSocketServer(app.server);
    logger.info('Socket.IO server initialized');

    // ============================================
    // START LISTENING
    // ============================================

    const address = await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏏  PitchPulse Backend Server                               ║
║                                                              ║
║   Server:    ${address.padEnd(47)}║
║   Environment: ${config.server.env.padEnd(47)}║
║                                                              ║
║   Endpoints:                                                ║
║   • Health:   ${`${address}/health`.padEnd(47)}║
║   • Ready:    ${`${address}/ready`.padEnd(47)}║
║   • API:      ${`${address}/api`.padEnd(47)}║
║   • Socket.IO: ${address.padEnd(46)}║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // ============================================
    // GRACEFUL SHUTDOWN HANDLER
    // ============================================

    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, initiating graceful shutdown...`);

      try {
        // Close Fastify
        await app.close();
        logger.info('Fastify server closed');

        // Disconnect Socket.IO
        try {
          const { disconnectSocketServer } = await import('./core/websocket/socket-server.js');
          await disconnectSocketServer();
          logger.info('Socket.IO server closed');
        } catch {
          // Socket might not be initialized
        }

        // Disconnect Redis
        if (redis) {
          await redis.quit();
          logger.info('Redis disconnected');
        }

        // Disconnect Prisma
        await prisma.$disconnect();
        logger.info('Database disconnected');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during graceful shutdown');
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught exception');
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal({ reason, promise }, 'Unhandled promise rejection');
    });

  } catch (error) {
    logger.fatal({
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error)
    }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
start();
