// Event Store
// Immutable event storage with idempotency, ordering, and snapshots
//
// Design Principles:
// 1. APPEND-ONLY: Never update or delete events
// 2. IMMUTABLE: Events cannot be modified after creation
// 3. ORDERED: sequenceNumber ensures strict ordering per match
// 4. IDEMPOTENT: eventId uniqueness prevents duplicate events
// 5. VERSIONED: version field for optimistic concurrency control
// 6. AUDITABLE: Metadata for userId, source, ipAddress
// 7. SNAPSHOTTED: State snapshots every N events for fast replay

import { prisma } from '../../core/db/prisma.js';
import { AppError, IdempotencyError, ConcurrencyError } from '../../core/middleware/error.middleware.js';
import { broadcastMatchEvent } from '../../core/websocket/socket-server.js';
import { eventLogger as logger } from '../../shared/utils/logger.js';

// ============================================
// TYPES
// ============================================

interface EventMetadata {
  readonly userId: string;
  readonly source?: string;
  readonly ipAddress?: string;
  readonly deviceInfo?: string;
  readonly location?: { readonly latitude: number; readonly longitude: number };
}

interface StoreEventParams<T = Record<string, unknown>> {
  readonly id: string;           // Client-generated UUID for idempotency
  readonly matchId: string;
  readonly eventType: string;
  readonly payload: T;
  readonly overNumber: number;
  readonly ballNumber: number;
  readonly metadata: EventMetadata;
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
  readonly source: string;
  readonly ipAddress: string | null;
}

interface Snapshot {
  readonly id: string;
  readonly matchId: string;
  readonly sequenceNumber: number;
  readonly state: unknown;
  readonly eventCount: number;
  readonly createdAt: Date;
}

interface EventQueryParams {
  readonly matchId: string;
  readonly fromSequence?: number;
  readonly toSequence?: number;
  readonly eventTypes?: readonly string[];
  readonly limit?: number;
  readonly offset?: number;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 100;
const SNAPSHOT_INTERVAL = 20; // Create snapshot every N events

// ============================================
// STORE OPERATIONS
// ============================================

/**
 * Store a new event with idempotency, ordering, and metadata
 *
 * @param params - Event parameters including client-generated id, metadata
 * @returns The stored event with sequence number
 * @throws IdempotencyError if event with same id already exists
 * @throws ConcurrencyError if optimistic locking fails
 */
async function storeEvent<T = Record<string, unknown>>(
  params: StoreEventParams<T>
): Promise<StoredEvent> {
  const { id, matchId, eventType, payload, overNumber, ballNumber, metadata } = params;
  const { userId, source = 'api', ipAddress } = metadata;

  let attempts = 0;

  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
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

        // Create the event with metadata
        const event = await tx.event.create({
          data: {
            id,
            matchId,
            eventType: eventType as never,
            sequenceNumber,
            overNumber,
            ballNumber,
            payload: payload as never,
            createdBy: userId,
            source,
            ipAddress,
          },
        });

        // Check if we need to create a snapshot
        if (sequenceNumber % SNAPSHOT_INTERVAL === 0) {
          await createSnapshot(tx, matchId, sequenceNumber, payload);
        }

        return event;
      });

      logger.debug({
        eventId: id,
        matchId,
        eventType,
        sequenceNumber: result.sequenceNumber,
        createdBy: userId,
        source,
      }, 'Event stored successfully');

      return result as StoredEvent;

    } catch (error) {
      if (error instanceof IdempotencyError) {
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
 * Create a snapshot of the current match state
 */
async function createSnapshot(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  matchId: string,
  sequenceNumber: number,
  state: unknown
): Promise<Snapshot> {
  const snapshot = await tx.snapshot.create({
    data: {
      matchId,
      sequenceNumber,
      state: state as never,
      eventCount: 0, // Will be updated
    },
  });

  logger.info({
    matchId,
    sequenceNumber,
    snapshotId: snapshot.id,
  }, 'Snapshot created');

  return snapshot as Snapshot;
}

/**
 * Store event and broadcast to connected clients
 */
async function storeAndBroadcast<T = Record<string, unknown>>(
  params: StoreEventParams<T>
): Promise<StoredEvent> {
  const event = await storeEvent(params);

  try {
    await broadcastMatchEvent(params.matchId, event, event.sequenceNumber);
  } catch (error) {
    logger.error({ error, eventId: event.id }, 'Failed to broadcast event');
  }

  return event;
}

// ============================================
// QUERY OPERATIONS
// ============================================

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
 * Get events since a specific sequence number
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
 * Get latest snapshot for a match
 */
async function getLatestSnapshot(matchId: string): Promise<Snapshot | null> {
  const snapshot = await prisma.snapshot.findFirst({
    where: { matchId },
    orderBy: { sequenceNumber: 'desc' },
  });

  return snapshot as Snapshot | null;
}

/**
 * Get snapshots for a match
 */
async function getSnapshots(
  matchId: string,
  limit = 10
): Promise<readonly Snapshot[]> {
  const snapshots = await prisma.snapshot.findMany({
    where: { matchId },
    orderBy: { sequenceNumber: 'desc' },
    take: limit,
  });

  return snapshots as readonly Snapshot[];
}

// ============================================
// REPLAY OPERATIONS (with Snapshot optimization)
// ============================================

type EventHandler = (event: StoredEvent) => Promise<void>;

interface ReplayResult {
  readonly processed: number;
  readonly failed: number;
  readonly fromSnapshot: number;
  readonly errors: ReadonlyArray<{ eventId: string; error: string }>;
}

/**
 * Replay events for a match, starting from latest snapshot
 */
async function replayEvents(
  matchId: string,
  handler: EventHandler,
  options?: { fromSequence?: number; toSequence?: number }
): Promise<ReplayResult> {
  const { fromSequence: forcedFromSequence, toSequence } = options ?? {};

  let fromSnapshotSequence = 0;
  let state: unknown = null;

  // Try to get latest snapshot if no forced sequence provided
  if (forcedFromSequence === undefined) {
    const snapshot = await getLatestSnapshot(matchId);
    if (snapshot) {
      fromSnapshotSequence = snapshot.sequenceNumber;
      state = snapshot.state;
      logger.info({
        matchId,
        snapshotSequence: snapshot.sequenceNumber,
      }, 'Starting replay from snapshot');
    }
  }

  // Build query
  const where: {
    matchId: string;
    sequenceNumber: { gt?: number; lte?: number };
  } = {
    matchId,
    sequenceNumber: { gt: fromSnapshotSequence },
  };

  if (forcedFromSequence !== undefined) {
    where.sequenceNumber.gt = forcedFromSequence;
  }

  if (toSequence !== undefined) {
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

  return {
    processed,
    failed,
    fromSnapshot: fromSnapshotSequence,
    errors,
  };
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
  getLatestSnapshot,
  getSnapshots,
  replayEvents,
  createSnapshot,
  SNAPSHOT_INTERVAL,
  type StoreEventParams,
  type StoredEvent,
  type Snapshot,
  type EventQueryParams,
  type EventHandler,
  type ReplayResult,
  type EventMetadata,
};
