// Redis Pub/Sub
// Real-time event broadcasting using Redis pub/sub
//
// Design:
// - Redis acts as a central pub/sub hub
// - Backend server subscribes to channels and broadcasts to WebSocket clients
// - Enables horizontal scaling (multiple server instances)

import { redisClient } from './redis.js';

// ============================================
// CHANNEL DEFINITIONS
// ============================================

export const CHANNELS = {
  // Match events - broadcast all events for a specific match
  MATCH_EVENTS: (matchId: string) => `match:${matchId}:events`,

  // Match scoreboard updates
  MATCH_SCOREBOARD: (matchId: string) => `match:${matchId}:scoreboard`,

  // Match commentary
  MATCH_COMMENTARY: (matchId: string) => `match:${matchId}:commentary`,

  // Match status changes (started, paused, completed)
  MATCH_STATUS: (matchId: string) => `match:${matchId}:status`,

  // Tournament updates
  TOURNAMENT_UPDATES: (tournamentId: string) => `tournament:${tournamentId}:updates`,

  // Points table updates
  TOURNAMENT_POINTS: (tournamentId: string) => `tournament:${tournamentId}:points`,

  // System notifications
  SYSTEM: 'system:notifications',

  // Admin broadcast
  ADMIN_BROADCAST: 'admin:broadcast',
} as const;

export type ChannelName = keyof typeof CHANNELS | string;

// ============================================
// PUBLISHER
// ============================================

interface PublishOptions {
  readonly channel: string;
  readonly message: unknown;
  readonly pattern?: never;
}

interface PublishPatternOptions {
  readonly pattern: string;
  readonly message: unknown;
  readonly channel?: never;
}

type PublishOptionsType = PublishOptions | PublishPatternOptions;

/**
 * Publish a message to a Redis channel
 * Non-blocking operation
 */
async function publish(options: PublishOptionsType): Promise<number> {
  if (!redisClient) {
    console.warn('Redis not configured - publish skipped');
    return 0;
  }

  const channel = options.channel ?? options.pattern;
  const message = JSON.stringify(options.message);

  try {
    // Use publish for channel or psubscribe for patterns
    if (options.pattern) {
      // Pattern-based publishing (advanced use case)
      // Note: This requires psubscribe on the receiving end
      const subscriber = new (await import('ioredis')).Redis(redisClient.options);
      subscriber.publish(options.pattern, message);
      return 1;
    }

    return await redisClient.publish(channel, message);
  } catch (error) {
    console.error(`Failed to publish to ${channel}:`, error);
    return 0;
  }
}

/**
 * Publish match event (convenience method)
 */
async function publishMatchEvent(
  matchId: string,
  event: unknown
): Promise<number> {
  return publish({
    channel: CHANNELS.MATCH_EVENTS(matchId),
    message: event,
  });
}

/**
 * Publish scoreboard update (convenience method)
 */
async function publishScoreboardUpdate(
  matchId: string,
  scoreboard: unknown
): Promise<number> {
  return publish({
    channel: CHANNELS.MATCH_SCOREBOARD(matchId),
    message: scoreboard,
  });
}

// ============================================
// SUBSCRIBER
// ============================================

type MessageHandler = (channel: string, message: string) => void | Promise<void>;

interface Subscriber {
  readonly subscribe: (channels: readonly string[], handler: MessageHandler) => Promise<void>;
  readonly unsubscribe: (channels: readonly string[]) => Promise<void>;
  readonly disconnect: () => Promise<void>;
}

/**
 * Create a new subscriber instance
 * Each subscriber maintains its own connection
 */
function createSubscriber(): Subscriber {
  if (!redisClient) {
    throw new Error('Redis not configured - cannot create subscriber');
  }

  const subscriber = new (require('ioredis').default)(redisClient.options);
  const handlers = new Map<string, Set<MessageHandler>>();

  subscriber.on('message', (channel: string, message: string) => {
    const channelHandlers = handlers.get(channel);
    if (channelHandlers) {
      channelHandlers.forEach((handler) => {
        try {
          handler(channel, message);
        } catch (error) {
          console.error(`Handler error for channel ${channel}:`, error);
        }
      });
    }
  });

  return {
    async subscribe(channels: readonly string[], handler: MessageHandler): Promise<void> {
      // Register handlers
      channels.forEach((channel) => {
        if (!handlers.has(channel)) {
          handlers.set(channel, new Set());
        }
        handlers.get(channel)!.add(handler);
      });

      // Subscribe to channels
      await subscriber.subscribe(...channels);
    },

    async unsubscribe(channels: readonly string[]): Promise<void> {
      // Remove handlers
      channels.forEach((channel) => {
        const channelHandlers = handlers.get(channel);
        if (channelHandlers) {
          channelHandlers.clear();
          handlers.delete(channel);
        }
      });

      // Unsubscribe from channels
      await subscriber.unsubscribe(...channels);
    },

    async disconnect(): Promise<void> {
      handlers.clear();
      await subscriber.quit();
    },
  };
}

export { publish, publishMatchEvent, publishScoreboardUpdate, createSubscriber };
export type { PublishOptions, MessageHandler, Subscriber };
