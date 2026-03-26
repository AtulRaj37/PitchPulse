// Event Sourcing Types for Cricket Scoring
// Strict TypeScript with proper typing for all event payloads

import { EventType, WicketType, BallType, DismissalMode } from '../constants/event-types';

// ============================================
// BASE EVENT TYPES (Immutable)
// ============================================

/**
 * Base event interface - all events are immutable
 * eventId is client-generated for idempotency
 */
export interface BaseEvent {
  id: string;              // Client-generated UUID for idempotency
  matchId: string;
  eventType: EventType;
  sequenceNumber: number;  // Strict ordering within a match
  overNumber: number;
  ballNumber: number;
  timestamp: Date;
  createdBy: string;
  version: number;         // Optimistic concurrency control
}

/**
 * Event metadata for audit trail
 */
export interface EventMetadata {
  deviceInfo?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  userAgent?: string;
}

// ============================================
// TYPED EVENT PAYLOADS
// All payloads are strictly typed based on eventType
// ============================================

/**
 * Ball bowled event payload
 */
export interface BallBowledPayload {
  readonly bowlerId: string;
  readonly batsmanId: string;
  readonly ballType: BallType;
  readonly runs: number;
  readonly isExtra: boolean;
  readonly commentary?: string;
}

/**
 * Run scored event payload
 */
export interface RunScoredPayload {
  readonly runs: number;
  readonly batsmanId: string;
  readonly bowlerId: string;
  readonly isByes: boolean;
  readonly isLegByes: boolean;
  readonly previousBowlerId?: string;
  readonly newBowlerId?: string;
}

/**
 * Boundary scored event payload
 */
export interface BoundaryScoredPayload {
  readonly runs: 4 | 6;
  readonly batsmanId: string;
  readonly bowlerId: string;
  readonly shotType?: string;
  readonly direction?: string;
}

/**
 * Wicket fell event payload
 */
export interface WicketFellPayload {
  readonly batsmanId: string;
  readonly bowlerId: string;
  readonly wicketType: WicketType;
  readonly dismissalMode: DismissalMode;
  readonly fielderId?: string;
  readonly newBatsmanId?: string;
}

/**
 * Wide ball event payload
 */
export interface WideBallPayload {
  readonly bowlerId: string;
  readonly batsmanId: string;
  readonly extraRuns: number;
  readonly isUnofficial: boolean;
  readonly commentary?: string;
}

/**
 * No ball event payload
 */
export interface NoBallPayload {
  readonly bowlerId: string;
  readonly batsmanId: string;
  readonly extraRuns: number;
  readonly isFreeHit: boolean;
  readonly commentary?: string;
}

/**
 * Over completed event payload
 */
export interface OverCompletedPayload {
  readonly bowlerId: string;
  readonly totalRuns: number;
  readonly wickets: number;
  readonly isMaiden: boolean;
  readonly isUnofficial: boolean;
}

/**
 * Match created event payload
 */
export interface MatchCreatedPayload {
  readonly team1Id: string;
  readonly team2Id: string;
  readonly venue: string;
  readonly startTime: string;
  readonly format: string;
  readonly overs: number;
  readonly tournamentId?: string;
}

/**
 * Toss completed event payload
 */
export interface TossCompletedPayload {
  readonly winnerTeamId: string;
  readonly decision: 'BAT' | 'BOWL';
  readonly battingTeamId: string;
  readonly bowlingTeamId: string;
}

/**
 * Innings started event payload
 */
export interface InningsStartedPayload {
  readonly inningsNumber: 1 | 2 | 3 | 4;
  readonly battingTeamId: string;
  readonly bowlingTeamId: string;
  readonly strikerId: string;
  readonly nonStrikerId: string;
  readonly bowlerId: string;
}

/**
 * Innings completed event payload
 */
export interface InningsCompletedPayload {
  readonly inningsNumber: 1 | 2 | 3 | 4;
  readonly battingTeamId: string;
  readonly totalRuns: number;
  readonly totalWickets: number;
  readonly overs: number;
  readonly runRate: number;
  readonly declared: boolean;
  readonly followOn: boolean;
}

/**
 * Dispute flagged event payload
 */
export interface DisputeFlaggedPayload {
  readonly reason: string;
  readonly flaggedBy: string;
  readonly eventId: string;
  readonly description: string;
}

/**
 * Decision reversed event payload (correction event)
 */
export interface DecisionReversedPayload {
  readonly originalEventId: string;
  readonly correctionEventId: string;
  readonly reversedBy: string;
  readonly description: string;
}

/**
 * Event corrected payload (for corrections)
 */
export interface EventCorrectedPayload {
  readonly originalEventId: string;
  readonly correctionEventId: string;
  readonly correctedBy: string;
  readonly reason: string;
}

/**
 * Union type for all possible event payloads
 * Type-safe discriminated union based on eventType
 */
export type EventPayload =
  | BallBowledPayload
  | RunScoredPayload
  | BoundaryScoredPayload
  | WicketFellPayload
  | WideBallPayload
  | NoBallPayload
  | OverCompletedPayload
  | MatchCreatedPayload
  | TossCompletedPayload
  | InningsStartedPayload
  | InningsCompletedPayload
  | DisputeFlaggedPayload
  | DecisionReversedPayload
  | EventCorrectedPayload
  | Record<string, never>; // Empty object for events without payload

// ============================================
// FULL EVENT TYPE (Discriminated Union)
// ============================================

/**
 * Discriminated union of all event types
 * Type-safe based on eventType
 */
export type TypedEvent<T extends EventPayload = EventPayload> = {
  [K in EventType]: {
    readonly id: string;
    readonly matchId: string;
    readonly eventType: K;
    readonly sequenceNumber: number;
    readonly overNumber: number;
    readonly ballNumber: number;
    readonly timestamp: Date;
    readonly createdBy: string;
    readonly version: number;
    readonly payload: ExtractEventPayload<K>;
    readonly metadata?: EventMetadata;
  };
}[EventType];

/**
 * Type helper to extract payload type from event type
 */
type ExtractEventPayload<T extends EventType> =
  | (T extends EventType.BALL_BOWLED ? BallBowledPayload : never)
  | (T extends EventType.RUN_SCORED ? RunScoredPayload : never)
  | (T extends EventType.BOUNDARY_SCORED ? BoundaryScoredPayload : never)
  | (T extends EventType.SIX_SCORED ? BoundaryScoredPayload : never)
  | (T extends EventType.WICKET_FELL ? WicketFellPayload : never)
  | (T extends EventType.WIDE_BALL ? WideBallPayload : never)
  | (T extends EventType.NO_BALL ? NoBallPayload : never)
  | (T extends EventType.OVER_COMPLETED ? OverCompletedPayload : never)
  | (T extends EventType.MATCH_CREATED ? MatchCreatedPayload : never)
  | (T extends EventType.TOSS_COMPLETED ? TossCompletedPayload : never)
  | (T extends EventType.INNINGS_STARTED ? InningsStartedPayload : never)
  | (T extends EventType.INNINGS_COMPLETED ? InningsCompletedPayload : never)
  | (T extends EventType.DISPUTE_FLAGGED ? DisputeFlaggedPayload : never)
  | (T extends EventType.DECISION_REVERSED ? DecisionReversedPayload : never)
  | (T extends EventType.EVENT_CORRECTED ? EventCorrectedPayload : never)
  | Record<string, never>;

// ============================================
// EVENT CREATION DTOS
// ============================================

export interface CreateBallBowledEvent {
  readonly id: string;           // Client-generated for idempotency
  readonly matchId: string;
  readonly bowlerId: string;
  readonly batsmanId: string;
  readonly ballType: BallType;
  readonly runs: number;
  readonly isExtra: boolean;
  readonly commentary?: string;
}

export interface CreateRunScoredEvent {
  readonly id: string;
  readonly matchId: string;
  readonly runs: number;
  readonly batsmanId: string;
  readonly bowlerId: string;
  readonly isByes?: boolean;
  readonly isLegByes?: boolean;
}

export interface CreateWicketEvent {
  readonly id: string;
  readonly matchId: string;
  readonly batsmanId: string;
  readonly bowlerId: string;
  readonly wicketType: WicketType;
  readonly dismissalMode: DismissalMode;
  readonly fielderId?: string;
}

export interface CreateDisputeEvent {
  readonly id: string;
  readonly matchId: string;
  readonly eventId: string;
  readonly reason: string;
  readonly description: string;
  readonly flaggedBy: string;
}

// ============================================
// EVENT QUERY TYPES
// ============================================

export interface EventQueryFilters {
  readonly matchId?: string;
  readonly eventTypes?: readonly EventType[];
  readonly fromDate?: Date;
  readonly toDate?: Date;
  readonly createdBy?: string;
  readonly fromSequence?: number;
  readonly toSequence?: number;
  readonly limit?: number;
  readonly offset?: number;
}

export interface EventStreamResponse {
  readonly events: readonly TypedEvent[];
  readonly total: number;
  readonly hasMore: boolean;
  readonly nextOffset?: number;
  readonly latestSequenceNumber?: number;
}

// ============================================
// PROJECTION TYPES
// ============================================

export interface ProjectionResult {
  readonly success: boolean;
  readonly processedEvents: number;
  readonly errors: readonly ProjectionError[];
}

export interface ProjectionError {
  readonly eventId: string;
  readonly error: string;
  readonly retryable: boolean;
}

export interface IdempotentOperation<T> {
  readonly execute: () => Promise<T>;
  readonly idempotencyKey: string;
}
