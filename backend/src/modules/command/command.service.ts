// Command Service
// Orchestrates command validation, event generation, atomic storage, and async broadcasting
//
// Flow:
// 1. Receive command
// 2. Validate with EventValidator
// 3. Generate events from command
// 4. Store events atomically in event store
// 5. Update match status in database
// 6. Broadcast events asynchronously (Redis pub/sub + WebSocket)
// 7. Return result
//
// Design:
// - Atomic event writes (all or nothing)
// - Async broadcasting (non-blocking)
// - Idempotent (uses client-generated UUIDs)

import { prisma } from '../../core/db/prisma.js';
import { AppError, NotFoundError } from '../../core/middleware/error.middleware.js';
import { storeEvent, type StoredEvent } from '../../event-sourcing/event-store/event-store.js';
import { eventValidator, type CommandType } from '../../event-sourcing/event-validator/event-validator.js';
import { buildMatchState, type MatchState } from '../../event-sourcing/match-state/match-state.js';
import {
  type CricketCommand,
  type CommandResult,
  type CommandEvent,
  generateEvents,
} from './command.types.js';
import { broadcastMatchEvent, broadcastScoreboardUpdate } from '../../core/websocket/socket-server.js';
import { commandLogger as logger } from '../../shared/utils/logger.js';

// ============================================
// SERVICE
// ============================================

/**
 * Execute a cricket command
 * - Validates the command
 * - Generates events
 * - Stores events atomically
 * - Broadcasts asynchronously
 */
async function executeCommand(
  command: CricketCommand,
  context: {
    readonly userId: string;
    readonly source?: string;
    readonly ipAddress?: string;
  }
): Promise<CommandResult> {
  const commandId = crypto.randomUUID();
  const matchId = command.payload.matchId;

  logger.debug({
    commandId,
    commandType: command.type,
    matchId,
    userId: context.userId,
  }, 'Executing command');

  try {
    // Step 1: Validate the command
    const matchState = await eventValidator.validateCommand(
      command.type as CommandType,
      matchId,
      command.payload as unknown as Record<string, unknown>,
      context
    );

    // Step 2: Generate events from command
    const events = generateEvents(command, {
      userId: context.userId,
      source: context.source,
      ipAddress: context.ipAddress,
      matchState,
    });

    if (events.length === 0) {
      throw new AppError('No events generated from command', 'NO_EVENTS', 400);
    }

    // Step 3: Store events atomically
    const storedEvents = await storeEventsAtomically(events, {
      matchId,
      userId: context.userId,
      source: context.source ?? 'api',
      ipAddress: context.ipAddress,
    });

    // Step 4: Update match status based on command
    await updateMatchStatus(command, matchState);

    // Step 4.5: Run Synchronous/Asynchronous CQRS Projections
    import('../../event-sourcing/projections/projection-handler.js')
      .then(({ runProjections }) => runProjections(matchId, storedEvents))
      .catch((error) => logger.error({ error, matchId }, 'CQRS Projection failed'));

    // Step 5: Broadcast events asynchronously (non-blocking)
    broadcastEventsAsync(storedEvents, matchId).catch((error) => {
      logger.error({ error, matchId }, 'Async broadcast failed');
    });

    // Step 6: Build and return updated match state
    const updatedMatchState = await buildCurrentMatchState(matchId);

    logger.debug({
      commandId,
      commandType: command.type,
      matchId,
      eventsGenerated: events.length,
      eventsStored: storedEvents.length,
    }, 'Command executed successfully');

    return {
      success: true,
      commandId,
      events: storedEvents.map(e => ({
        id: e.id,
        eventType: e.eventType as any,
        payload: e.payload as Record<string, unknown>,
        overNumber: e.overNumber,
        ballNumber: e.ballNumber,
      })),
      matchState: updatedMatchState,
      timestamp: new Date(),
    };

  } catch (error) {
    logger.error({
      commandId,
      commandType: command.type,
      matchId,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'Command execution failed');

    throw error;
  }
}

/**
 * Store multiple events atomically
 * Uses database transaction to ensure all events are stored or none
 */
async function storeEventsAtomically(
  events: readonly CommandEvent[],
  context: {
    readonly matchId: string;
    readonly userId: string;
    readonly source: string;
    readonly ipAddress?: string;
  }
): Promise<readonly StoredEvent[]> {
  const storedEvents: StoredEvent[] = [];

  for (const event of events) {
    const stored = await storeEvent({
      id: event.id,
      matchId: context.matchId,
      eventType: event.eventType,
      payload: event.payload,
      overNumber: event.overNumber,
      ballNumber: event.ballNumber,
      metadata: {
        userId: context.userId,
        source: context.source,
        ipAddress: context.ipAddress,
      },
    });
    storedEvents.push(stored);
  }

  return storedEvents;
}

/**
 * Update match status based on command type
 */
async function updateMatchStatus(
  command: CricketCommand,
  currentState: MatchState
): Promise<void> {
  const matchId = command.payload.matchId;

  let newStatus: 'CREATED' | 'LIVE' | 'COMPLETED' | 'ABANDONED' | undefined;

  switch (command.type) {
    case 'START_MATCH':
      newStatus = 'LIVE';
      break;
    case 'COMPLETE_MATCH':
      newStatus = 'COMPLETED';
      break;
    case 'ABANDON_MATCH':
      newStatus = 'ABANDONED';
      break;
    default:
      // Other commands don't change match status
      break;
  }

  if (newStatus) {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        status: newStatus,
        ...(newStatus === 'COMPLETED' || newStatus === 'ABANDONED' ? { endTime: new Date() } : {}),
      },
    });

    logger.info({ matchId, newStatus }, 'Match status updated');
  }
}

/**
 * Broadcast events asynchronously via Redis pub/sub and WebSocket
 * This is non-blocking - errors are logged but don't affect the command result
 */
async function broadcastEventsAsync(
  events: readonly StoredEvent[],
  matchId: string
): Promise<void> {
  for (const event of events) {
    // Broadcast via WebSocket to connected clients (handles Redis horizontal scaling natively via adapter)
    await broadcastMatchEvent(matchId, event, event.sequenceNumber);
  }

  // Also broadcast updated scoreboard
  const matchState = await buildCurrentMatchState(matchId);
  await broadcastScoreboardUpdate(matchId, matchState);

  logger.debug({ matchId, eventsBroadcast: events.length }, 'Events broadcasted');
}

/**
 * Build current match state after command execution
 */
async function buildCurrentMatchState(matchId: string): Promise<MatchState> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new NotFoundError('Match', matchId);
  }

  const { events } = await import('../../event-sourcing/event-store/event-store.js').then(
    (m) => m.getEvents({ matchId, limit: 10000 })
  );

  return buildMatchState(matchId, events, {
    format: match.format,
    overs: match.overs,
    ballsPerOver: match.ballsPerOver,
    team1Id: match.team1Id,
    team2Id: match.team2Id,
    status: match.status as 'CREATED' | 'LIVE' | 'COMPLETED' | 'ABANDONED',
  });
}

// ============================================
// EXPORTS
// ============================================

export { executeCommand };

// Re-export types
export type { CricketCommand, CommandResult, CommandEvent } from './command.types.js';
