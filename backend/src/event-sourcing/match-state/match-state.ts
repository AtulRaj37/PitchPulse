// Match State Builder
// Central function to compute match state from events
// Derives: score, wickets, overs, striker, bowler, run rate
//
// Design Principles:
// 1. Pure function - no side effects, same input always yields same output
// 2. Immutable - events are never modified
// 3. Ordered - events are processed in sequenceNumber order
// 4. Complete - must handle all event types

import { EventType, BallType, WicketType, DismissalMode } from '@pitchpulse/shared';
import type { StoredEvent } from '../event-store/event-store.js';
import { matchStateLogger as logger } from '../../shared/utils/logger.js';

// ============================================
// TYPES
// ============================================

export interface BattingPosition {
  readonly playerId: string;
  readonly runs: number;
  readonly balls: number;
  readonly fours: number;
  readonly sixes: number;
  readonly isOut: boolean;
  readonly dismissalType?: WicketType;
  readonly dismissalMode?: DismissalMode;
  readonly fielderId?: string;
  readonly bowlerId?: string;
}

export interface BowlingFigure {
  readonly playerId: string;
  readonly overs: number;
  readonly balls: number;
  readonly maidens: number;
  readonly runs: number;
  readonly wickets: number;
}

export interface InningsState {
  readonly inningsNumber: 1 | 2 | 3 | 4;
  readonly battingTeamId: string;
  readonly bowlingTeamId: string;
  readonly totalRuns: number;
  readonly totalWickets: number;
  readonly overs: number;        // Formal overs (e.g., 5.3 = 5 overs and 3 balls)
  readonly balls: number;        // Raw ball count within current over
  readonly runRate: number;
  readonly target?: number;       // For chase
  readonly requiredRuns?: number;
  readonly requiredBalls?: number;
  readonly projectedScore?: number;
  readonly declared: boolean;
  readonly followOn: boolean;
  readonly strikerId?: string;
  readonly nonStrikerId?: string;
  readonly bowlerId?: string;
  readonly battingOrder: readonly BattingPosition[];
  readonly bowlingFigures: readonly BowlingFigure[];
  readonly extras: {
    readonly wides: number;
    readonly noBalls: number;
    readonly byes: number;
    readonly legByes: number;
    readonly penaltyRuns: number;
    readonly total: number;
  };
}

export interface MatchState {
  readonly matchId: string;
  readonly status: 'CREATED' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
  readonly format: string;
  readonly overs: number;
  readonly ballsPerOver: number;
  readonly team1Id: string;
  readonly team2Id: string;
  readonly toss?: {
    readonly winnerTeamId: string;
    readonly decision: 'BAT' | 'BOWL';
    readonly battingTeamId: string;
    readonly bowlingTeamId: string;
  };
  readonly currentInnings: 1 | 2 | 3 | 4;
  readonly innings: readonly InningsState[];
  readonly lastEventSequence: number;
  readonly lastUpdated: Date;
}

// ============================================
// INTERNAL ACCUMULATOR
// ============================================

interface BuilderAccumulator {
  matchId: string;
  format: string;
  overs: number;
  ballsPerOver: number;
  team1Id: string;
  team2Id: string;
  status: 'CREATED' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
  toss?: {
    winnerTeamId: string;
    decision: 'BAT' | 'BOWL';
    battingTeamId: string;
    bowlingTeamId: string;
  };
  innings: InningsState[];
  currentInningsIndex: number; // Index into innings array (0-based)
  lastEventSequence: number;
}

// ============================================
// MAIN BUILDER FUNCTION
// ============================================

/**
 * Build complete match state from an ordered list of events
 * This is the central function for deriving match state
 *
 * @param matchId - The match ID
 * @param events - Ordered array of events (by sequenceNumber)
 * @param matchMeta - Basic match metadata (format, overs, teams)
 * @returns Complete MatchState
 */
function buildMatchState(
  matchId: string,
  events: readonly StoredEvent[],
  matchMeta: {
    readonly format: string;
    readonly overs: number;
    readonly ballsPerOver: number;
    readonly team1Id: string;
    readonly team2Id: string;
    readonly status: 'CREATED' | 'LIVE' | 'COMPLETED' | 'ABANDONED';
  }
): MatchState {
  // Initialize accumulator with base state
  let acc: BuilderAccumulator = {
    matchId,
    format: matchMeta.format,
    overs: matchMeta.overs,
    ballsPerOver: matchMeta.ballsPerOver,
    team1Id: matchMeta.team1Id,
    team2Id: matchMeta.team2Id,
    status: matchMeta.status,
    innings: [],
    currentInningsIndex: -1,
    lastEventSequence: 0,
  };

  // Process each event in order
  for (const event of events) {
    acc = processEvent(acc, event);
  }

  // Calculate projected scores and required runs for current innings
  if (acc.currentInningsIndex >= 0) {
    const innings = acc.innings[acc.currentInningsIndex];
    if (innings.target !== undefined) {
      const inningsWithRequired = calculateRequired(innings, matchMeta.overs, matchMeta.ballsPerOver);
      acc.innings[acc.currentInningsIndex] = inningsWithRequired;
    }
  }

  return {
    matchId: acc.matchId,
    status: acc.status,
    format: acc.format,
    overs: acc.overs,
    ballsPerOver: acc.ballsPerOver,
    team1Id: acc.team1Id,
    team2Id: acc.team2Id,
    toss: acc.toss,
    currentInnings: (acc.currentInningsIndex + 1) as 1 | 2 | 3 | 4,
    innings: acc.innings,
    lastEventSequence: acc.lastEventSequence,
    lastUpdated: new Date(),
  };
}

/**
 * Get current innings state from match state
 */
function getCurrentInnings(state: MatchState): InningsState | null {
  if (state.innings.length === 0) return null;
  return state.innings[state.innings.length - 1];
}

/**
 * Get formatted over display (e.g., "5.3" means 5 overs and 3 balls)
 */
function formatOvers(rawBalls: number, ballsPerOver: number): number {
  const overs = Math.floor(rawBalls / ballsPerOver);
  const balls = rawBalls % ballsPerOver;
  return Number(`${overs}.${balls}`);
}

// ============================================
// EVENT PROCESSORS
// ============================================

function processEvent(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  acc.lastEventSequence = event.sequenceNumber;

  // Auto-recover missing INNINGS_STARTED if a scoring event occurs and no innings exists
  const isScoringEvent = [
    EventType.BALL_BOWLED, EventType.RUN_SCORED, EventType.BOUNDARY_SCORED,
    EventType.SIX_SCORED, EventType.WICKET_FELL, EventType.WIDE_BALL,
    EventType.NO_BALL, EventType.BYE, EventType.LEG_BYE, EventType.OVER_COMPLETED
  ].includes(event.eventType as EventType);

  let currentAcc = acc;
  if (isScoringEvent && currentAcc.currentInningsIndex < 0) {
    const battingTeamId = currentAcc.toss ? (currentAcc.toss.decision === 'BAT' ? currentAcc.toss.winnerTeamId : (currentAcc.toss.winnerTeamId === currentAcc.team1Id ? currentAcc.team2Id : currentAcc.team1Id)) : currentAcc.team1Id;
    const bowlingTeamId = currentAcc.toss ? (currentAcc.toss.decision === 'BOWL' ? currentAcc.toss.winnerTeamId : (currentAcc.toss.winnerTeamId === currentAcc.team1Id ? currentAcc.team2Id : currentAcc.team1Id)) : currentAcc.team2Id;
    const payload = event.payload as any;

    currentAcc = processInningsStarted(currentAcc, {
      ...event,
      eventType: EventType.INNINGS_STARTED,
      payload: {
        inningsNumber: 1,
        battingTeamId,
        bowlingTeamId,
        strikerId: payload.batsmanId || '',
        nonStrikerId: '',
        bowlerId: payload.bowlerId || ''
      }
    });
  }

  switch (event.eventType as EventType) {
    case EventType.MATCH_STARTED:
      return processMatchStarted(currentAcc, event);
    case EventType.MATCH_COMPLETED:
      return processMatchCompleted(currentAcc, event);
    case EventType.MATCH_ABANDONED:
      return processMatchAbandoned(currentAcc, event);
    case EventType.TOSS_COMPLETED:
      return processTossCompleted(currentAcc, event);
    case EventType.INNINGS_STARTED:
      return processInningsStarted(currentAcc, event);
    case EventType.INNINGS_COMPLETED:
      return processInningsCompleted(currentAcc, event);
    case EventType.BALL_BOWLED:
      return processBallBowled(currentAcc, event);
    case EventType.RUN_SCORED:
      return processRunScored(currentAcc, event);
    case EventType.BOUNDARY_SCORED:
    case EventType.SIX_SCORED:
      return processBoundaryScored(currentAcc, event);
    case EventType.WICKET_FELL:
      return processWicketFell(currentAcc, event);
    case EventType.WIDE_BALL:
      return processWideBall(currentAcc, event);
    case EventType.NO_BALL:
      return processNoBall(currentAcc, event);
    case EventType.BYE:
      return processBye(currentAcc, event);
    case EventType.LEG_BYE:
      return processLegBye(currentAcc, event);
    case EventType.OVER_COMPLETED:
      return processOverCompleted(currentAcc, event);
    case EventType.BATSMAN_OUT:
      return processBatsmanOut(currentAcc, event);
    case EventType.NEW_BATSMAN:
      return processNewBatsman(currentAcc, event);
    case EventType.BOWLER_CHANGED:
      return processBowlerChanged(currentAcc, event);
    case EventType.PENALTY_RUNS:
      return processPenaltyRuns(currentAcc, event);
    default:
      // Unknown event type - skip but log
      logger.warn({ eventType: event.eventType }, 'Unknown event type in match state builder');
      return currentAcc;
  }
}

function processMatchStarted(acc: BuilderAccumulator, _event: StoredEvent): BuilderAccumulator {
  return { ...acc, status: 'LIVE' };
}

function processMatchCompleted(acc: BuilderAccumulator, _event: StoredEvent): BuilderAccumulator {
  return { ...acc, status: 'COMPLETED' };
}

function processMatchAbandoned(acc: BuilderAccumulator, _event: StoredEvent): BuilderAccumulator {
  return { ...acc, status: 'ABANDONED' };
}

function processTossCompleted(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  const payload = event.payload as {
    winnerTeamId: string;
    decision: 'BAT' | 'BOWL';
    battingTeamId: string;
    bowlingTeamId: string;
  };
  return {
    ...acc,
    toss: {
      winnerTeamId: payload.winnerTeamId,
      decision: payload.decision,
      battingTeamId: payload.battingTeamId,
      bowlingTeamId: payload.bowlingTeamId,
    },
  };
}

function processInningsStarted(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  const payload = event.payload as {
    inningsNumber: 1 | 2 | 3 | 4;
    battingTeamId: string;
    bowlingTeamId: string;
    strikerId: string;
    nonStrikerId: string;
    bowlerId: string;
  };

  // Set target for innings 2+ based on first innings total
  const target = (payload.inningsNumber > 1 && acc.innings.length > 0) 
    ? acc.innings[acc.innings.length - 1].totalRuns + 1 
    : undefined;

  const newInnings: InningsState = {
    inningsNumber: payload.inningsNumber,
    battingTeamId: payload.battingTeamId,
    bowlingTeamId: payload.bowlingTeamId,
    totalRuns: 0,
    totalWickets: 0,
    overs: 0,
    balls: 0,
    runRate: 0,
    target,
    declared: false,
    followOn: false,
    strikerId: payload.strikerId,
    nonStrikerId: payload.nonStrikerId,
    bowlerId: payload.bowlerId,
    battingOrder: [],
    bowlingFigures: [],
    extras: {
      wides: 0,
      noBalls: 0,
      byes: 0,
      legByes: 0,
      penaltyRuns: 0,
      total: 0,
    },
  };

  const newInningsList = [...acc.innings, newInnings];
  return {
    ...acc,
    innings: newInningsList,
    currentInningsIndex: newInningsList.length - 1,
  };
}

function processInningsCompleted(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  const payload = event.payload as {
    inningsNumber: 1 | 2 | 3 | 4;
    declared: boolean;
    followOn: boolean;
  };

  if (acc.currentInningsIndex < 0) return acc;

  const currentInnings = acc.innings[acc.currentInningsIndex];
  const updatedInnings: InningsState = {
    ...currentInnings,
    declared: payload.declared,
    followOn: payload.followOn,
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return {
    ...acc,
    innings: newInningsList,
    currentInningsIndex: newInningsList.length - 1,
  };
}

function processBallBowled(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as {
    bowlerId: string;
    batsmanId: string;
    ballType: BallType;
    runs: number;
    isExtra: boolean;
  };

  const innings = acc.innings[acc.currentInningsIndex];

  // Update batting position for striker
  const battingOrder = [...innings.battingOrder];
  const strikerIdx = battingOrder.findIndex(b => b.playerId === payload.batsmanId);
  if (strikerIdx === -1) {
    battingOrder.push({
      playerId: payload.batsmanId,
      runs: payload.isExtra ? 0 : payload.runs,
      balls: payload.isExtra ? 0 : 1,
      fours: payload.runs === 4 && !payload.isExtra ? 1 : 0,
      sixes: payload.runs === 6 && !payload.isExtra ? 1 : 0,
      isOut: false,
    });
  } else {
    const striker = battingOrder[strikerIdx];
    battingOrder[strikerIdx] = {
      ...striker,
      runs: striker.runs + (payload.isExtra ? 0 : payload.runs),
      balls: striker.balls + (payload.isExtra ? 0 : 1),
      fours: striker.fours + (payload.runs === 4 && !payload.isExtra ? 1 : 0),
      sixes: striker.sixes + (payload.runs === 6 && !payload.isExtra ? 1 : 0),
      isOut: striker.isOut,
    };
  }

  // Update bowling figures
  const bowlingFigures = [...innings.bowlingFigures];
  const bowlerIdx = bowlingFigures.findIndex(b => b.playerId === payload.bowlerId);
  if (bowlerIdx === -1) {
    bowlingFigures.push({
      playerId: payload.bowlerId,
      overs: 0,
      balls: 1,
      maidens: 0,
      runs: payload.isExtra ? 0 : payload.runs,
      wickets: 0,
    });
  } else {
    const bowler = bowlingFigures[bowlerIdx];
    bowlingFigures[bowlerIdx] = {
      ...bowler,
      balls: bowler.balls + 1,
      runs: bowler.runs + (payload.isExtra ? 0 : payload.runs),
      wickets: bowler.wickets,
    };
  }

  // Calculate new balls and overs
  const newBalls = innings.balls + 1;
  const ballsPerOver = acc.ballsPerOver;
  const newOvers = formatOvers(newBalls, ballsPerOver);
  const newRuns = innings.totalRuns + payload.runs;
  const runRate = newBalls > 0 ? (newRuns / newBalls) * ballsPerOver : 0;

  const updatedInnings: InningsState = {
    ...innings,
    totalRuns: newRuns,
    totalWickets: innings.totalWickets,
    overs: newOvers,
    balls: newBalls,
    runRate: Math.round(runRate * 100) / 100,
    battingOrder,
    bowlingFigures,
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processRunScored(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  // RUN_SCORED is typically paired with BALL_BOWLED for strike rotation
  // The actual scoring is handled in processBallBowled
  // Here we just handle strike rotation
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as {
    runs: number;
    batsmanId: string;
    bowlerId: string;
    isByes: boolean;
    isLegByes: boolean;
    previousBowlerId?: string;
    newBowlerId?: string;
  };

  const innings = acc.innings[acc.currentInningsIndex];
  const needsStrikeRotation = payload.runs % 2 === 1;

  let updatedInnings: InningsState = { ...innings };

  if (needsStrikeRotation) {
    updatedInnings = {
      ...innings,
      strikerId: innings.nonStrikerId,
      nonStrikerId: innings.strikerId,
    };
  }

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processBoundaryScored(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  // Boundary scoring is reflected in total runs - handled in processBallBowled
  // Here we just update batting position for boundary count
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as {
    runs: 4 | 6;
    batsmanId: string;
  };

  const innings = acc.innings[acc.currentInningsIndex];
  const battingOrder = [...innings.battingOrder];
  const strikerIdx = battingOrder.findIndex(b => b.playerId === payload.batsmanId);

  if (strikerIdx !== -1) {
    const striker = battingOrder[strikerIdx];
    battingOrder[strikerIdx] = {
      ...striker,
      runs: striker.runs + payload.runs,
      balls: striker.balls + 1,
      fours: striker.fours + (payload.runs === 4 ? 1 : 0),
      sixes: striker.sixes + (payload.runs === 6 ? 1 : 0),
    };
  }

  const updatedInnings = { ...innings, battingOrder };
  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processWicketFell(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as {
    batsmanId: string;
    bowlerId: string;
    wicketType: WicketType;
    dismissalMode: DismissalMode;
    fielderId?: string;
  };

  const innings = acc.innings[acc.currentInningsIndex];
  const battingOrder = [...innings.battingOrder];
  const strikerIdx = battingOrder.findIndex(b => b.playerId === payload.batsmanId);

  if (strikerIdx !== -1) {
    battingOrder[strikerIdx] = {
      ...battingOrder[strikerIdx],
      isOut: true,
      dismissalType: payload.wicketType,
      dismissalMode: payload.dismissalMode,
      fielderId: payload.fielderId,
      bowlerId: payload.bowlerId,
    };
  }

  const isStrikerOut = payload.batsmanId === innings.strikerId;
  const isNonStrikerOut = payload.batsmanId === innings.nonStrikerId;

  const updatedInnings = {
    ...innings,
    totalWickets: innings.totalWickets + 1,
    battingOrder,
    strikerId: isStrikerOut ? undefined : innings.strikerId,
    nonStrikerId: isNonStrikerOut ? undefined : innings.nonStrikerId,
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processWideBall(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as {
    bowlerId: string;
    extraRuns: number;
  };

  const innings = acc.innings[acc.currentInningsIndex];
  const updatedInnings = {
    ...innings,
    totalRuns: innings.totalRuns + payload.extraRuns,
    extras: {
      ...innings.extras,
      wides: innings.extras.wides + payload.extraRuns,
      total: innings.extras.total + payload.extraRuns,
    },
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processNoBall(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as {
    bowlerId: string;
    extraRuns: number;
  };

  const innings = acc.innings[acc.currentInningsIndex];
  const updatedInnings = {
    ...innings,
    totalRuns: innings.totalRuns + payload.extraRuns,
    extras: {
      ...innings.extras,
      noBalls: innings.extras.noBalls + payload.extraRuns,
      total: innings.extras.total + payload.extraRuns,
    },
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processBye(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as { runs: number };

  const innings = acc.innings[acc.currentInningsIndex];
  const updatedInnings = {
    ...innings,
    totalRuns: innings.totalRuns + payload.runs,
    balls: innings.balls + 1,
    extras: {
      ...innings.extras,
      byes: innings.extras.byes + payload.runs,
      total: innings.extras.total + payload.runs,
    },
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processLegBye(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as { runs: number };

  const innings = acc.innings[acc.currentInningsIndex];
  const updatedInnings = {
    ...innings,
    totalRuns: innings.totalRuns + payload.runs,
    balls: innings.balls + 1,
    extras: {
      ...innings.extras,
      legByes: innings.extras.legByes + payload.runs,
      total: innings.extras.total + payload.runs,
    },
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processOverCompleted(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as {
    bowlerId: string;
    totalRuns: number;
    isMaiden: boolean;
  };

  const innings = acc.innings[acc.currentInningsIndex];
  const bowlingFigures = [...innings.bowlingFigures];
  const bowlerIdx = bowlingFigures.findIndex(b => b.playerId === payload.bowlerId);

  if (bowlerIdx !== -1) {
    const bowler = bowlingFigures[bowlerIdx];
    bowlingFigures[bowlerIdx] = {
      ...bowler,
      overs: bowler.overs + 1,
      balls: bowler.balls - (bowler.balls % acc.ballsPerOver), // Round down to full over
      maidens: bowler.maidens + (payload.isMaiden ? 1 : 0),
    };
  }

  // Rotate strike at end of over
  const updatedInnings = {
    ...innings,
    bowlingFigures,
    strikerId: innings.nonStrikerId,
    nonStrikerId: innings.strikerId,
    bowlerId: undefined, // Will be set when new bowler is assigned
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processBatsmanOut(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  // Same as WICKET_FELL essentially
  return processWicketFell(acc, event);
}

function processNewBatsman(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as { newBatsmanId: string, isNonStriker?: boolean };
  const innings = acc.innings[acc.currentInningsIndex];

  const battingOrder = [...innings.battingOrder];
  const existingIdx = battingOrder.findIndex(b => b.playerId === payload.newBatsmanId);

  if (existingIdx === -1) {
    battingOrder.push({
      playerId: payload.newBatsmanId,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
    });
  }

  let newStrikerId = innings.strikerId;
  let newNonStrikerId = innings.nonStrikerId;

  if (payload.isNonStriker) {
    newNonStrikerId = payload.newBatsmanId;
    if (newStrikerId === payload.newBatsmanId) newStrikerId = undefined;
  } else {
    if (!newStrikerId) {
      newStrikerId = payload.newBatsmanId;
    } else if (!newNonStrikerId) {
      newNonStrikerId = payload.newBatsmanId;
    } else {
      // Both full, manual override
      newStrikerId = payload.newBatsmanId;
      if (newNonStrikerId === payload.newBatsmanId) newNonStrikerId = undefined;
    }
  }

  const updatedInnings = {
    ...innings,
    battingOrder,
    strikerId: newStrikerId,
    nonStrikerId: newNonStrikerId,
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processBowlerChanged(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as { newBowlerId: string };

  const innings = acc.innings[acc.currentInningsIndex];
  const updatedInnings = {
    ...innings,
    bowlerId: payload.newBowlerId,
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

function processPenaltyRuns(acc: BuilderAccumulator, event: StoredEvent): BuilderAccumulator {
  if (acc.currentInningsIndex < 0) return acc;

  const payload = event.payload as { runs: number };

  const innings = acc.innings[acc.currentInningsIndex];
  const updatedInnings = {
    ...innings,
    totalRuns: innings.totalRuns + payload.runs,
    extras: {
      ...innings.extras,
      penaltyRuns: innings.extras.penaltyRuns + payload.runs,
      total: innings.extras.total + payload.runs,
    },
  };

  const newInningsList = [...acc.innings];
  newInningsList[acc.currentInningsIndex] = updatedInnings;

  return { ...acc, innings: newInningsList };
}

// ============================================
// HELPERS
// ============================================

function calculateRequired(
  innings: InningsState,
  totalOvers: number,
  ballsPerOver: number
): InningsState {
  if (innings.target === undefined) return innings;

  const totalBalls = totalOvers * ballsPerOver;
  const remainingBalls = totalBalls - innings.balls;
  const requiredRuns = innings.target - innings.totalRuns;
  const requiredBalls = remainingBalls;

  let projectedScore = 0;
  if (innings.balls > 0) {
    projectedScore = Math.round((innings.totalRuns / innings.balls) * totalBalls * 100) / 100;
  }

  return {
    ...innings,
    requiredRuns,
    requiredBalls,
    projectedScore,
  };
}

export {
  buildMatchState,
  getCurrentInnings,
  formatOvers,
};
