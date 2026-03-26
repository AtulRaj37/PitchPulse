// Prisma Client Singleton
// Database connection and client management

import { PrismaClient, type Prisma } from '@prisma/client';
import { config } from '../../config/index.js';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const prismaOptions: Prisma.PrismaClientOptions = {
  log: config.server.isDev
    ? ['error', 'warn'] // Removed 'query' — it floods the terminal and slows performance
    : ['error'],
  errorFormat: config.server.isDev ? 'pretty' : 'minimal',
};

let prisma: PrismaClient;

if (config.server.isDev) {
  // Prevent multiple instances in development
  prisma = global.__prisma ?? new PrismaClient(prismaOptions);
  global.__prisma = prisma;
} else {
  prisma = new PrismaClient(prismaOptions);
}

// Pre-warm the connection pool so the first user request doesn't wait for Neon cold start
prisma.$connect().catch(() => {
  // Silently fail — the connection will be retried on first query
});

// Graceful shutdown
async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}

// Health check
async function ping(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

export { prisma, disconnect, ping };

export type { PrismaClient, Prisma };

