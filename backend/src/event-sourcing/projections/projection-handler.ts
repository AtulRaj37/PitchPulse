// Projection Manager
// Handles event projections with idempotency and retry logic
//
// Design Principles:
// 1. IDEMPOTENT: Projections can be safely re-run without side effects
// 2. EVENTUALLY CONSISTENT: May lag behind event store
// 3. REBUILDABLE: Can be reconstructed from event store
// 4. RETRY-SAFE: Failed projections are retried with backoff

import { prisma } from '../../core/db/prisma.js';
import { broadcastScoreboardUpdate } from '../../core/websocket/socket-server.js';
import { eventLogger as logger } from '../../shared/utils/logger.js';
import type { StoredEvent } from '../event-store/event-store.js';

// ============================================
// TYPES
// ============================================

interface ProjectionResult {
  readonly success: boolean;
  readonly processedEvents: number;
  readonly failedEvents: number;
  readonly errors: readonly ProjectionError[];
  readonly duration: number;
}

interface ProjectionError {
  readonly eventId: string;
  readonly eventType: string;
  readonly error: string;
  readonly retryable: boolean;
}

interface ProjectionState {
  readonly matchId: string;
  readonly lastProcessedSequence: number;
  readonly status: 'idle' | 'processing' | 'error';
  readonly lastError?: string;
  readonly updatedAt: Date;
}

// ============================================
// CONSTANTS
// ============================================

const MAX_PROJECTION_RETRIES = 3;
const PROJECTION_RETRY_DELAY_MS = 500;
const BATCH_SIZE = 50;

// ============================================
// PROJECTION HANDLERS
// ============================================

type ProjectionHandler = (event: StoredEvent) => Promise<void>;

/**
 * Scorecard projection - updates the innings and batting/bowling stats
 * Idempotent: uses upsert operations
 */
async function projectToScorecard(event: StoredEvent): Promise<void> {
  const { matchId, eventType, payload } = event;

  // Get or create innings
  const inningsNumber = await calculateInningsNumber(event);
  if (!inningsNumber) return;

  // Update innings based on event type
  switch (eventType) {
    case 'INNINGS_STARTED':
    case 'RUN_SCORED':
    case 'WICKET_FELL':
    case 'WIDE_BALL':
    case 'NO_BALL':
    case 'BYE':
    case 'LEG_BYE':
    case 'OVER_COMPLETED':
    case 'BALL_BOWLED':
      await updateInningsScore(event, inningsNumber);
      break;

    case 'INNINGS_COMPLETED':
      await finalizeInnings(matchId, inningsNumber, payload);
      break;
  }

  // Update batting/bowling stats
  if (eventType === 'RUN_SCORED' || eventType === 'WICKET_FELL' || eventType === 'BALL_BOWLED') {
    await updateBattingStats(matchId, inningsNumber, payload, eventType);
  }

  if (eventType === 'OVER_COMPLETED' || eventType === 'BALL_BOWLED' || eventType === 'WICKET_FELL') {
    await updateBowlingStats(matchId, inningsNumber, payload, eventType);
  }

  // Broadcast updated scoreboard
  await broadcastScoreboard(matchId);
}

/**
 * Player stats projection - updates career statistics
 * Idempotent: aggregates from batting/bowling stats
 */
async function projectToPlayerStats(event: StoredEvent): Promise<void> {
  const { eventType, payload } = event;

  if (eventType === 'INNINGS_COMPLETED') {
    // Aggregate stats from innings to player stats
    const typedPayload = payload as {
      readonly battingTeamId: string;
      readonly totalRuns: number;
      readonly totalWickets: number;
    };

    await aggregatePlayerStats(typedPayload.battingTeamId);
  }
}

// ============================================
// PROJECTION RUNNER
// ============================================

/**
 * Run projections for a batch of events
 * Idempotent and retry-safe
 */
async function runProjections(
  matchId: string,
  events: readonly StoredEvent[]
): Promise<ProjectionResult> {
  const startTime = Date.now();
  const errors: ProjectionError[] = [];

  for (const event of events) {
    let attempts = 0;
    let success = false;

    while (attempts < MAX_PROJECTION_RETRIES && !success) {
      try {
        await projectToScorecard(event);
        await projectToPlayerStats(event);
        success = true;
      } catch (error) {
        attempts++;

        if (attempts >= MAX_PROJECTION_RETRIES) {
          errors.push({
            eventId: event.id,
            eventType: event.eventType,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryable: false,
          });
        } else {
          // Exponential backoff
          await sleep(PROJECTION_RETRY_DELAY_MS * Math.pow(2, attempts - 1));
        }
      }
    }
  }

  const duration = Date.now() - startTime;

  return {
    success: errors.length === 0,
    processedEvents: events.length - errors.length,
    failedEvents: errors.length,
    errors,
    duration,
  };
}

/**
 * Rebuild all projections for a match
 * Used for recovery or initialization
 */
async function rebuildProjections(
  matchId: string,
  handler: (event: StoredEvent) => Promise<void> = projectToScorecard
): Promise<ProjectionResult> {
  logger.info({ matchId }, 'Starting projection rebuild');

  const events = await prisma.event.findMany({
    where: { matchId },
    orderBy: { sequenceNumber: 'asc' },
  });

  if (events.length === 0) {
    return {
      success: true,
      processedEvents: 0,
      failedEvents: 0,
      errors: [],
      duration: 0,
    };
  }

  // Process in batches
  let processed = 0;
  let failed = 0;
  const errors: ProjectionError[] = [];

  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE) as StoredEvent[];

    for (const event of batch) {
      try {
        await handler(event);
        processed++;
      } catch (error) {
        failed++;
        errors.push({
          eventId: event.id,
          eventType: event.eventType,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        });
      }
    }
  }

  logger.info({
    matchId,
    processed,
    failed,
    totalEvents: events.length,
  }, 'Projection rebuild completed');

  return {
    success: failed === 0,
    processedEvents: processed,
    failedEvents: failed,
    errors,
    duration: 0,
  };
}

// ============================================
// PRIVATE HELPERS
// ============================================

async function calculateInningsNumber(event: StoredEvent): Promise<number | null> {
  const payload = event.payload as { readonly inningsNumber?: number };

  if (payload.inningsNumber) {
    return payload.inningsNumber;
  }

  // Infer from event characteristics
  if (event.eventType === 'INNINGS_STARTED') {
    return 1;
  }

  // Fallback to match snapshot to determine active innings
  const match = await prisma.match.findUnique({
    where: { id: event.matchId },
    select: { currentSnapshot: true }
  });

  if (match?.currentSnapshot && typeof match.currentSnapshot === 'object') {
     const snap = match.currentSnapshot as any;
     if (snap.innings) return snap.innings;
  }

  return 1;
}

async function updateInningsScore(
  event: StoredEvent,
  inningsNumber: number
): Promise<void> {
  const { matchId, eventType, payload, overNumber, ballNumber } = event;
  const typedPayload = payload as Record<string, any>;

  // Fetch existing innings to accumulate stats properly
  const existingInnings = await prisma.innings.findUnique({
    where: { matchId_inningsNumber: { matchId, inningsNumber } }
  });

  const updateData: {
    totalRuns?: number;
    totalWickets?: number;
    overs?: number;
    balls?: number;
    runRate?: number;
  } = {};

  if (['RUN_SCORED', 'WIDE_BALL', 'NO_BALL', 'BYE', 'LEG_BYE'].includes(eventType)) {
    const runDelta = (typedPayload.runs ?? 0) + (typedPayload.extraRuns ?? 0);
    updateData.totalRuns = existingInnings ? existingInnings.totalRuns + runDelta : runDelta;
  }

  if (eventType === 'WICKET_FELL') {
    updateData.totalWickets = existingInnings ? existingInnings.totalWickets + 1 : 1;
  }

  if (eventType === 'BALL_BOWLED') {
    // Only normal balls increment the ball count
    updateData.balls = existingInnings ? existingInnings.balls + 1 : 1;
  }

  if (eventType === 'OVER_COMPLETED') {
    // Over completed usually signifies exactly 6 balls (unless modified), but we can just map the absolute overNumber + 1
    updateData.overs = overNumber + 1.0;
  } else if (eventType === 'BALL_BOWLED') {
    const currentBallsInOver = ballNumber + 1; 
    
    // An alternative robust way is:
    updateData.overs = overNumber + (currentBallsInOver > 0 ? (currentBallsInOver / 10) : 0);
  }

  // Calculate run rate using cumulative totals
  const finalRuns = updateData.totalRuns ?? existingInnings?.totalRuns ?? 0;
  const finalOvers = updateData.overs ?? existingInnings?.overs ?? 0;
  
  if (finalRuns !== undefined && finalOvers !== undefined) {
    updateData.runRate = finalOvers > 0 ? Number((finalRuns / Math.max(1, Math.floor(finalOvers) + ((finalOvers % 1) * 10) / 6)).toFixed(2)) : 0;
  }

  // Fetch match to determine teams if creating
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { toss: true }
  });

  let battingTeamId = '';
  let bowlingTeamId = '';
  
  if (match) {
    if (inningsNumber === 1) {
      if (match.toss) {
        battingTeamId = match.toss.decision === 'BAT' ? match.toss.winnerId : (match.toss.winnerId === match.team1Id ? match.team2Id : match.team1Id);
        bowlingTeamId = match.toss.decision === 'BOWL' ? match.toss.winnerId : (match.toss.winnerId === match.team1Id ? match.team2Id : match.team1Id);
      } else {
        battingTeamId = match.team1Id;
        bowlingTeamId = match.team2Id;
      }
    } else {
      // Innings 2 is reversed
      if (match.toss) {
        bowlingTeamId = match.toss.decision === 'BAT' ? match.toss.winnerId : (match.toss.winnerId === match.team1Id ? match.team2Id : match.team1Id);
        battingTeamId = match.toss.decision === 'BOWL' ? match.toss.winnerId : (match.toss.winnerId === match.team1Id ? match.team2Id : match.team1Id);
      } else {
        battingTeamId = match.team2Id;
        bowlingTeamId = match.team1Id;
      }
    }
  }

  // Upsert innings (idempotent-ish, assuming ordered replay)
  await prisma.innings.upsert({
    where: {
      matchId_inningsNumber: { matchId, inningsNumber },
    },
    update: {
      ...updateData,
      ...(battingTeamId && !existingInnings?.battingTeamId ? { battingTeamId, bowlingTeamId } : {})
    },
    create: {
      matchId,
      inningsNumber,
      battingTeamId,
      bowlingTeamId,
      totalRuns: updateData.totalRuns ?? 0,
      totalWickets: updateData.totalWickets ?? 0,
      overs: updateData.overs ?? 0,
      balls: updateData.balls ?? 0,
      runRate: updateData.runRate ?? 0,
    },
  });
}

async function finalizeInnings(
  matchId: string,
  inningsNumber: number,
  payload: unknown
): Promise<void> {
  const typedPayload = payload as {
    readonly totalRuns: number;
    readonly totalWickets: number;
    readonly overs: number;
    readonly runRate: number;
    readonly declared?: boolean;
  };

  await prisma.innings.update({
    where: {
      matchId_inningsNumber: { matchId, inningsNumber },
    },
    data: {
      totalRuns: typedPayload.totalRuns,
      totalWickets: typedPayload.totalWickets,
      overs: typedPayload.overs,
      runRate: typedPayload.runRate,
      declared: typedPayload.declared ?? false,
    },
  });
}

async function updateBattingStats(
  matchId: string,
  inningsNumber: number,
  payload: unknown,
  eventType: string
): Promise<void> {
  const typedPayload = payload as Record<string, any>;

  if (!typedPayload.batsmanId) {
    return;
  }

  // Get innings ID
  const innings = await prisma.innings.findUnique({
    where: {
      matchId_inningsNumber: { matchId, inningsNumber },
    },
    select: { id: true },
  });

  if (!innings) return;

  // Upsert batting stats (idempotent)
  const existing = await prisma.battingStats.findUnique({
    where: {
      inningsId_playerId: {
        inningsId: innings.id,
        playerId: typedPayload.batsmanId,
      },
    },
  });

  const runs = typedPayload.runs ?? 0;
  const isBoundary = runs === 4;
  const isSix = runs === 6;

  // Wides do NOT count as a ball faced for the batsman
  const isBallFaced = eventType === 'BALL_BOWLED' && typedPayload.ballType !== 'WIDE_BALL' && typedPayload.ballType !== 'WIDE' && typedPayload.isExtra !== true;

  // The final dismissal payload could use different standard fields, coerce into SQL Read Model equivalents
  const finalDismissal = typedPayload.dismissalMode && typedPayload.dismissalMode !== 'BATSMAN_OUT' 
    ? typedPayload.dismissalMode 
    : (typedPayload.wicketType || typedPayload.dismissalType);

  const updatedRuns = existing ? (eventType === 'RUN_SCORED' ? existing.runs + runs : existing.runs) : (eventType === 'RUN_SCORED' ? runs : 0);
  const updatedBalls = existing ? (isBallFaced ? existing.balls + 1 : existing.balls) : (isBallFaced ? 1 : 0);

  await prisma.battingStats.upsert({
    where: {
      inningsId_playerId: {
        inningsId: innings.id,
        playerId: typedPayload.batsmanId,
      },
    },
    update: {
      runs: updatedRuns,
      balls: updatedBalls,
      fours: existing ? (eventType === 'RUN_SCORED' && isBoundary ? existing.fours + 1 : existing.fours) : (eventType === 'RUN_SCORED' && isBoundary ? 1 : 0),
      sixes: existing ? (eventType === 'RUN_SCORED' && isSix ? existing.sixes + 1 : existing.sixes) : (eventType === 'RUN_SCORED' && isSix ? 1 : 0),
      isOut: eventType === 'WICKET_FELL' ? true : (typedPayload.isOut || !!typedPayload.wicketType || !!typedPayload.dismissalType || existing?.isOut || false),
      dismissalType: eventType === 'WICKET_FELL' ? finalDismissal : (finalDismissal || existing?.dismissalType),
      bowlerId: eventType === 'WICKET_FELL' ? typedPayload.bowlerId : (typedPayload.bowlerId || existing?.bowlerId),
      fielderId: eventType === 'WICKET_FELL' ? typedPayload.fielderId : (typedPayload.fielderId || existing?.fielderId),
      strikeRate: updatedBalls > 0 ? Number(((updatedRuns / updatedBalls) * 100).toFixed(2)) : 0,
    },
    create: {
      inningsId: innings.id,
      playerId: typedPayload.batsmanId,
      position: existing ? existing.position : await prisma.battingStats.count({ where: { inningsId: innings.id } }) + 1,
      runs: eventType === 'RUN_SCORED' ? runs : 0,
      balls: isBallFaced ? 1 : 0,
      fours: eventType === 'RUN_SCORED' && isBoundary ? 1 : 0,
      sixes: eventType === 'RUN_SCORED' && isSix ? 1 : 0,
      isOut: eventType === 'WICKET_FELL' ? true : (typedPayload.isOut || !!typedPayload.wicketType || !!typedPayload.dismissalType || false),
      dismissalType: eventType === 'WICKET_FELL' ? finalDismissal : finalDismissal,
      bowlerId: typedPayload.bowlerId,
      fielderId: typedPayload.fielderId,
      strikeRate: (eventType === 'RUN_SCORED' ? runs : 0) > 0 ? (eventType === 'RUN_SCORED' ? runs : 0) * 100 : 0,
    },
  });
}

async function updateBowlingStats(
  matchId: string,
  inningsNumber: number,
  payload: unknown,
  eventType: string
): Promise<void> {
  const typedPayload = payload as {
    readonly bowlerId?: string;
    readonly runs?: number;
    readonly wickets?: number;
    readonly overs?: number;
    readonly maidens?: number;
    readonly isWide?: boolean;
    readonly isNoBall?: boolean;
    readonly isLegBye?: boolean;
    readonly isBye?: boolean;
  };

  if (!typedPayload.bowlerId) {
    return;
  }

  // Get innings ID
  const innings = await prisma.innings.findUnique({
    where: {
      matchId_inningsNumber: { matchId, inningsNumber },
    },
    select: { id: true },
  });

  if (!innings) return;

  // Fetch existing stats
  const existing = await prisma.bowlingStats.findUnique({
    where: {
      inningsId_playerId: {
        inningsId: innings.id,
        playerId: typedPayload.bowlerId,
      },
    },
  });

  // Calculate runs safely (exclude leg byes and byes from bowler's account)
  const isExtras = typedPayload.isLegBye || typedPayload.isBye;
  // If OVER_COMPLETED, runs are already applied via BALL_BOWLED
  const runs = (eventType === 'OVER_COMPLETED') ? 0 : (isExtras ? 0 : (typedPayload.runs ?? 0));
  
  // Calculate legal balls length for this event
  const isLegalBall = eventType === 'BALL_BOWLED' && !typedPayload.isWide && !typedPayload.isNoBall;
  
  // Accumulated state
  const previousBalls = existing?.balls ?? 0;
  const previousOversBase = Math.floor(existing?.overs ?? 0);
  
  let newBalls = previousBalls;
  let newOversBase = previousOversBase;

  if (eventType === 'BALL_BOWLED') {
    if (isLegalBall) newBalls += 1;
    // Auto-rollover the UI decimal (prevent 0.6 display glitch)
    // The explicit OVER_COMPLETED will still trigger but this secures the instantaneous metric
    if (newBalls >= 6) {
      newOversBase += Math.floor(newBalls / 6);
      newBalls = newBalls % 6;
    }
  }

  if (eventType === 'OVER_COMPLETED') {
    // Rely exclusively on BALL_BOWLED / WICKET_FELL to evaluate runs and wickets!
    // Prevent double-counting the final ball.
    if (newBalls > 0 && newBalls % 6 === 0) {
      newBalls = 0;
      newOversBase += 1;
    }
  }

  const finalOversCombined = newOversBase + (newBalls / 10); // Standard cricket notation e.g 1.4

  const wickets = eventType === 'OVER_COMPLETED' ? 0 : (eventType === 'WICKET_FELL' ? 1 : (typedPayload.wickets ?? 0));
  const maidens = typedPayload.maidens ?? 0;

  await prisma.bowlingStats.upsert({
    where: {
      inningsId_playerId: {
        inningsId: innings.id,
        playerId: typedPayload.bowlerId,
      },
    },
    update: {
      overs: finalOversCombined,
      balls: newBalls,
      maidens: existing ? existing.maidens + maidens : maidens,
      runs: existing ? existing.runs + runs : runs,
      wickets: existing ? existing.wickets + wickets : wickets,
      wides: existing ? existing.wides + (typedPayload.isWide ? 1 : 0) : (typedPayload.isWide ? 1 : 0),
      noBalls: existing ? existing.noBalls + (typedPayload.isNoBall ? 1 : 0) : (typedPayload.isNoBall ? 1 : 0),
      // To correctly map fours/sixes, the projection needs access to that payload if stored,
      // but we maintain parity with default logic.
      economy: finalOversCombined > 0 ? Number(((existing ? existing.runs + runs : runs) / (newOversBase + newBalls / 6)).toFixed(2)) : 0,
    },
    create: {
      inningsId: innings.id,
      playerId: typedPayload.bowlerId,
      overs: finalOversCombined,
      balls: newBalls,
      maidens,
      runs,
      wickets,
      wides: typedPayload.isWide ? 1 : 0,
      noBalls: typedPayload.isNoBall ? 1 : 0,
      economy: finalOversCombined > 0 ? Number((runs / (newOversBase + newBalls / 6)).toFixed(2)) : 0,
    },
  });
}

async function aggregatePlayerStats(teamId: string): Promise<void> {
  // Get all players from the team
  const players = await prisma.player.findMany({
    where: { teamId },
    select: { id: true },
  });

  for (const player of players) {
    // Aggregate batting stats
    const battingAggregates = await prisma.battingStats.aggregate({
      where: { playerId: player.id },
      _sum: { runs: true, balls: true, fours: true, sixes: true },
      _max: { runs: true },
      _count: true,
    });

    // Aggregate bowling stats
    const bowlingAggregates = await prisma.bowlingStats.aggregate({
      where: { playerId: player.id },
      _sum: { wickets: true, runs: true, balls: true, maidens: true },
      _count: true,
    });

    // Upsert player stats (idempotent)
    await prisma.playerStats.upsert({
      where: { playerId: player.id },
      update: {
        runs: battingAggregates._sum?.runs ?? 0,
        ballsFaced: battingAggregates._sum?.balls ?? 0,
        fours: battingAggregates._sum?.fours ?? 0,
        sixes: battingAggregates._sum?.sixes ?? 0,
        wickets: bowlingAggregates._sum?.wickets ?? 0,
        runsConceded: bowlingAggregates._sum?.runs ?? 0,
        ballsBowled: bowlingAggregates._sum?.balls ?? 0,
        maidenOvers: bowlingAggregates._sum?.maidens ?? 0,
      },
      create: {
        playerId: player.id,
        runs: battingAggregates._sum?.runs ?? 0,
        ballsFaced: battingAggregates._sum?.balls ?? 0,
        fours: battingAggregates._sum?.fours ?? 0,
        sixes: battingAggregates._sum?.sixes ?? 0,
        wickets: bowlingAggregates._sum?.wickets ?? 0,
        runsConceded: bowlingAggregates._sum?.runs ?? 0,
        ballsBowled: bowlingAggregates._sum?.balls ?? 0,
        maidenOvers: bowlingAggregates._sum?.maidens ?? 0,
      },
    });
  }
}

async function broadcastScoreboard(matchId: string): Promise<void> {
  try {
    // Get current scorecard
    const scorecard = await prisma.scorecard.findUnique({
      where: { matchId },
    });

    if (scorecard) {
      await broadcastScoreboardUpdate(matchId, scorecard);
    }
  } catch (error) {
    logger.error({ error, matchId }, 'Failed to broadcast scoreboard');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export {
  runProjections,
  rebuildProjections,
  projectToScorecard,
  projectToPlayerStats,
  type ProjectionResult,
  type ProjectionError,
  type ProjectionState,
};
