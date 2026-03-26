// Redis Client
// Connection management for caching and pub/sub

import { Redis, type RedisOptions } from 'ioredis';
import { config } from '../../config/index.js';

declare global {
  // eslint-disable-next-line no-var
  var __redis: any | undefined;
}

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number): number | null {
    if (times > 3) {
      return null; // Stop retrying
    }
    return Math.min(times * 200, 2000);
  },
  lazyConnect: true,
};

let redis: Redis | null = null;

if (config.redis.url) {
  if (config.server.isDev) {
    redis = global.__redis ?? new Redis(config.redis.url, redisOptions);
    global.__redis = redis;
  } else {
    redis = new Redis(config.redis.url, redisOptions);
  }

  // Connection handlers
  redis!.on('connect', () => {
    console.log('Redis connected');
  });

  redis!.on('error', (err: Error) => {
    console.error('Redis error:', err.message);
  });

  redis!.on('close', () => {
    console.log('Redis connection closed');
  });
} else {
  console.log('Redis not configured - caching disabled');
}

// Graceful disconnect
async function disconnect(): Promise<void> {
  if (redis) {
    await redis.quit();
  }
}

// Health check
async function ping(): Promise<boolean> {
  if (!redis) return false;
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

// Connection status
function isConnected(): boolean {
  return redis?.status === 'ready';
}

export { redis as redisClient, disconnect, ping, isConnected };
