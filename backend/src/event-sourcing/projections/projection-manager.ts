// Event Store
// Immutable event storage with idempotency and ordering
//
// Design Principles:
// 1. APPEND-ONLY: Never update or delete events
// 2. IMMUTABLE: Events cannot be modified after creation
// 3. ORDERED: sequenceNumber ensures strict ordering per match
// 4. IDEMPOTENT: eventId uniqueness prevents duplicate events
// 5. VERSIONED: version field for optimistic concurrency control

import { prisma } from '../../core/db/prisma.js';
import { AppError, IdempotencyError, ConcurrencyError } from '../../core/middleware/error.middleware.js';
import { broadcastMatchEvent } from '../../core/websocket/socket-server.js';
import { eventLogger as logger } from '../../shared/utils/logger.js';
// Event types are generic

// ============================================
// TYPES
// ============================================

interface StoreEventParams<T extends any = any> {
  readonly id: string;           // Client-generated UUID for idempotency
  readonly matchId: string;
  readonly eventType: string;
  readonly payload: T;
  readonly overNumber: number;
  readonly ballNumber: number;
  readonly createdBy: string;
  readonly metadata?: {
    readonly deviceInfo?: string;
    readonly location?: { readonly latitude: number; readonly longitude: number };
  };
}

interface StoredEvent {
  readonly id: string;
  readonly matchId: string;
  readonly eventType: string;
  readonly sequenceNumber: number;
  readonly overNumber: number;
  readonly ballNumber: number;
  readonly payload: unknown;
  readonly version: number;
  readonly timestamp: Date;
  readonly createdBy: string;
  readonly metadata?: unknown;
}

interface EventQueryParams {
  readonly matchId: string;
  readonly fromSequence?: number;
  readonly toSequence?: number;
  readonly eventTypes?: readonly string[];
  readonly limit?: number;
  readonly offset?: number;
}

interface EventReplayParams {
  readonly matchId: string;
  readonly fromSequence?: number;
  readonly toSequence?: number;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;

// ============================================
// STORE OPERATIONS
// ============================================

/**
 * Store a new event with idempotency and ordering guarantees
 *
 * @param params - Event parameters including client-generated id for idempotency
 * @returns The stored event with sequence number
 * @throws IdempotencyError if event with same id already exists
 * @throws ConcurrencyError if optimistic locking fails
 */
async function storeEvent<T extends any>(params: StoreEventParams<T>): Promise<StoredEvent> {
  const { id, matchId, eventType, payload, overNumber, ballNumber, createdBy, metadata } = params;

  let attempts = 0;

  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      // Use a transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Check for duplicate event (idempotency)
        const existing = await tx.event.findUnique({
          where: { id },
        });

        if (existing) {
          throw new IdempotencyError(id);
        }

        // Get the next sequence number for this match
        const lastEvent = await tx.event.findFirst({
          where: { matchId },
          orderBy: { sequenceNumber: 'desc' },
          select: { sequenceNumber: true },
        });

        const sequenceNumber = (lastEvent?.sequenceNumber ?? 0) + 1;

        // Create the event
        const event = await tx.event.create({
          data: {
            id,
            matchId,
            eventType: eventType as never,
            sequenceNumber,
            overNumber,
            ballNumber,
            payload: payload as never,
            createdBy,
          },
        });

        return event;
      });

      logger.info({
        eventId: id,
        matchId,
        eventType,
        sequenceNumber: result.sequenceNumber,
      }, 'Event stored successfully');

      return result as StoredEvent;

    } catch (error) {
      if (error instanceof IdempotencyError) {
        // Re-throw idempotency errors immediately
        throw error;
      }

      attempts++;

      if (attempts >= MAX_RETRY_ATTEMPTS) {
        logger.error({ error, attempts }, 'Failed to store event after max retries');
        throw new ConcurrencyError(`Failed to store event after ${MAX_RETRY_ATTEMPTS} attempts`);
      }

      logger.warn({ error, attempts }, 'Retrying event store');
      await sleep(RETRY_DELAY_MS * attempts);
    }
  }

  throw new ConcurrencyError('Failed to store event');
}

/**
 * Get events for a match with optional filtering
 */
async function getEvents(params: EventQueryParams): Promise<{
  events: readonly StoredEvent[];
  total: number;
  latestSequenceNumber: number;
}> {
  const { matchId, fromSequence, toSequence, eventTypes, limit = 100, offset = 0 } = params;

  const where: {
    matchId: string;
    sequenceNumber?: { gte?: number; lte?: number };
    eventType?: { in: any };
  } = { matchId };

  if (fromSequence !== undefined || toSequence !== undefined) {
    where.sequenceNumber = {};
    if (fromSequence !== undefined) where.sequenceNumber.gte = fromSequence;
    if (toSequence !== undefined) where.sequenceNumber.lte = toSequence;
  }

  if (eventTypes && eventTypes.length > 0) {
    where.eventType = { in: eventTypes as any };
  }

  const [events, total, lastEvent] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { sequenceNumber: 'asc' },
      take: limit,
      skip: offset,
    }),
    prisma.event.count({ where }),
    prisma.event.findFirst({
      where: { matchId },
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    }),
  ]);

  return {
    events: events as readonly StoredEvent[],
    total,
    latestSequenceNumber: lastEvent?.sequenceNumber ?? 0,
  };
}

/**
 * Get event by ID
 */
async function getEventById(eventId: string): Promise<StoredEvent | null> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
  });

  return event as StoredEvent | null;
}

/**
 * Get events since a specific sequence number (for catching up)
 */
async function getEventsSince(
  matchId: string,
  sequenceNumber: number,
  limit = 100
): Promise<readonly StoredEvent[]> {
  const events = await prisma.event.findMany({
    where: {
      matchId,
      sequenceNumber: { gt: sequenceNumber },
    },
    orderBy: { sequenceNumber: 'asc' },
    take: limit,
  });

  return events as readonly StoredEvent[];
}

/**
 * Replay events for a match (for rebuilding projections)
 */
async function replayEvents(
  params: EventReplayParams,
  handler: (event: StoredEvent) => Promise<void>
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ eventId: string; error: string }>;
}> {
  const { matchId, fromSequence, toSequence } = params;

  const where: {
    matchId: string;
    sequenceNumber?: { gte?: number; lte?: number };
  } = { matchId };

  if (fromSequence !== undefined) {
    where.sequenceNumber = { gte: fromSequence };
  }

  if (toSequence !== undefined) {
    where.sequenceNumber = where.sequenceNumber ?? {};
    where.sequenceNumber.lte = toSequence;
  }

  const events = await prisma.event.findMany({
    where,
    orderBy: { sequenceNumber: 'asc' },
  });

  let processed = 0;
  let failed = 0;
  const errors: Array<{ eventId: string; error: string }> = [];

  for (const event of events) {
    try {
      await handler(event as StoredEvent);
      processed++;
    } catch (error) {
      failed++;
      errors.push({
        eventId: event.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { processed, failed, errors };
}

// ============================================
// EVENT BROADCASTING
// ============================================

/**
 * Store event and broadcast to connected clients
 * This is the main entry point for new events
 */
async function storeAndBroadcast<T extends any>(
  params: StoreEventParams<T>
): Promise<StoredEvent> {
  // Store the event
  const event = await storeEvent(params);

  // Broadcast to WebSocket clients
  try {
    await broadcastMatchEvent(params.matchId, event, event.sequenceNumber);
  } catch (error) {
    // Log but don't fail - event is already stored
    logger.error({ error, eventId: event.id }, 'Failed to broadcast event');
  }

  return event;
}

// ============================================
// UTILITIES
// ============================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export {
  storeEvent,
  storeAndBroadcast,
  getEvents,
  getEventById,
  getEventsSince,
  replayEvents,
  type StoreEventParams,
  type StoredEvent,
  type EventQueryParams,
  type EventReplayParams,
};
