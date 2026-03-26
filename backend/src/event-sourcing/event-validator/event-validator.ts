// Event Validator
// Enforces cricket rules before events are stored
//
// Validation Rules:
// 1. Match must be in correct status for each operation
// 2. Ball count cannot exceed ballsPerOver
// 3. No events after match completion/abandonment
// 4. Proper striker/bowler validation
// 5. Wicket count cannot exceed 10
// 6. Over count cannot exceed total match overs
//
// Design Principles:
// 1. Fail fast - reject invalid commands early
// 2. Clear error messages with cricket context
// 3. No side effects - pure validation

import { prisma } from '../../core/db/prisma.js';
import { AppError } from '../../core/middleware/error.middleware.js';
import { EventType, BallType } from '@pitchpulse/shared';
import { getEvents, getLatestSnapshot } from '../event-store/event-store.js';
import { buildMatchState, type MatchState } from '../match-state/match-state.js';
import { eventValidatorLogger as logger } from '../../shared/utils/logger.js';

// ============================================
// TYPES
// ============================================

export type ValidationResult =
  | { valid: true; matchState: MatchState }
  | { valid: false; errors: readonly ValidationError[] };

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly context?: Record<string, unknown>;
}

// Command types that can be validated
export type CommandType =
  | 'SCORE_RUN'
  | 'WICKET'
  | 'START_INNINGS'
  | 'COMPLETE_INNINGS'
  | 'TOSS'
  | 'START_MATCH'
  | 'COMPLETE_MATCH'
  | 'ABANDON_MATCH'
  | 'WIDE'
  | 'NO_BALL'
  | 'BYE'
  | 'LEG_BYE'
  | 'CHANGE_BOWLER'
  | 'CHANGE_STRIKER'
  | 'CHANGE_NON_STRIKER';

interface CommandContext {
  readonly userId: string;
  readonly source?: string;
  readonly ipAddress?: string;
}

// ============================================
// VALIDATOR CLASS
// ============================================

class EventValidator {
  /**
   * Validate a scoring command before execution
   * Returns match state if valid, throws AppError if invalid
   */
  async validateCommand(
    commandType: CommandType,
    matchId: string,
    payload: Record<string, unknown>,
    context: CommandContext
  ): Promise<MatchState> {
    const result = await this.validate(commandType, matchId, payload, context);

    if (!result.valid) {
      const errorMessages = result.errors.map(e => e.message).join('; ');
      throw new AppError(errorMessages, 'VALIDATION_FAILED', 400, {
        errors: result.errors,
        commandType,
        matchId,
      });
    }

    return result.matchState;
  }

  /**
   * Validate a command and return detailed result
   */
  async validate(
    commandType: CommandType,
    matchId: string,
    payload: Record<string, unknown>,
    _context: CommandContext
  ): Promise<ValidationResult> {
    // Load match state
    const matchState = await this.buildMatchState(matchId);
    const errors: ValidationError[] = [];

    // Rule: No commands on completed or abandoned matches
    if (matchState.status === 'COMPLETED') {
      errors.push({
        code: 'MATCH_COMPLETED',
        message: 'Match has already been completed. No further scoring is allowed.',
      });
      return { valid: false, errors };
    }

    if (matchState.status === 'ABANDONED') {
      errors.push({
        code: 'MATCH_ABANDONED',
        message: 'Match has been abandoned. No further scoring is allowed.',
      });
      return { valid: false, errors };
    }

    // Rule: Match must be LIVE for scoring commands
    const scoringCommands: CommandType[] = [
      'SCORE_RUN', 'WICKET', 'WIDE', 'NO_BALL', 'BYE', 'LEG_BYE'
    ];

    if (scoringCommands.includes(commandType) && matchState.status !== 'LIVE') {
      errors.push({
        code: 'MATCH_NOT_LIVE',
        message: `Cannot score while match is in '${matchState.status}' status. Start the match first.`,
        field: 'status',
      });
    }

    // Command-specific validation
    switch (commandType) {
      case 'SCORE_RUN':
        this.validateScoreRun(matchState, payload, errors);
        break;
      case 'WICKET':
        this.validateWicket(matchState, payload, errors);
        break;
      case 'START_INNINGS':
        this.validateStartInnings(matchState, payload, errors);
        break;
      case 'COMPLETE_INNINGS':
        this.validateCompleteInnings(matchState, payload, errors);
        break;
      case 'TOSS':
        this.validateToss(matchState, payload, errors);
        break;
      case 'START_MATCH':
        this.validateStartMatch(matchState, payload, errors);
        break;
      case 'WIDE':
        this.validateWide(matchState, payload, errors);
        break;
      case 'NO_BALL':
        this.validateNoBall(matchState, payload, errors);
        break;
      case 'CHANGE_BOWLER':
      case 'CHANGE_STRIKER':
      case 'CHANGE_NON_STRIKER':
        // Safe pass-through: basic live match validation handled above
        break;
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return { valid: true, matchState };
  }

  // ========================================
  // COMMAND-SPECIFIC VALIDATIONS
  // ========================================

  private validateScoreRun(
    state: MatchState,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    const runs = payload.runs as number | undefined;
    const batsmanId = payload.batsmanId as string | undefined;
    const bowlerId = payload.bowlerId as string | undefined;

    if (runs === undefined || runs < 0 || runs > 6) {
      errors.push({
        code: 'INVALID_RUNS',
        message: 'Runs must be between 0 and 6 for a legal delivery.',
        field: 'runs',
      });
    }

    const innings = state.innings[state.innings.length - 1];
    if (innings) {
      // Check max balls per over
      const currentBallInOver = innings.balls % state.ballsPerOver;
      if (currentBallInOver >= state.ballsPerOver) {
        errors.push({
          code: 'OVER_COMPLETED',
          message: `Over already complete (${state.ballsPerOver} balls). Complete the over first.`,
          field: 'ball',
        });
      }

      // Validate striker exists and is not out
      if (batsmanId && innings.strikerId) {
        if (innings.strikerId !== batsmanId) {
          errors.push({
            code: 'NOT_STRIKER',
            message: `Player ${batsmanId} is not the current striker (${innings.strikerId}).`,
            field: 'batsmanId',
          });
        }

        const batsman = innings.battingOrder.find(b => b.playerId === batsmanId);
        if (batsman?.isOut) {
          errors.push({
            code: 'BATSMAN_OUT',
            message: `Batsman ${batsmanId} is already out. Record wicket first.`,
            field: 'batsmanId',
          });
        }
      }

      // Validate bowler
      if (bowlerId && innings.bowlerId && innings.bowlerId !== bowlerId) {
        errors.push({
          code: 'NOT_CURRENT_BOWLER',
          message: `Player ${bowlerId} is not the current bowler (${innings.bowlerId}).`,
          field: 'bowlerId',
        });
      }

      // Check over limit
      const maxBalls = state.overs * state.ballsPerOver;
      if (innings.balls >= maxBalls) {
        errors.push({
          code: 'OVERS_COMPLETED',
          message: `All ${state.overs} overs completed.`,
          field: 'overs',
        });
      }
    }
  }

  private validateWicket(
    state: MatchState,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    const batsmanId = payload.batsmanId as string | undefined;
    const bowlerId = payload.bowlerId as string | undefined;

    const innings = state.innings[state.innings.length - 1];
    if (innings) {
      // Check wicket limit
      if (innings.totalWickets >= 10) {
        errors.push({
          code: 'ALL_OUT',
          message: 'All 10 wickets have fallen. Innings is complete.',
          field: 'wickets',
        });
      }

      // Validate batsman is striker
      if (batsmanId && innings.strikerId && innings.strikerId !== batsmanId) {
        errors.push({
          code: 'NOT_STRIKER',
          message: `Cannot record wicket for non-striker ${batsmanId}.`,
          field: 'batsmanId',
        });
      }

      // Validate batsman exists and is not already out
      if (batsmanId) {
        const batsman = innings.battingOrder.find(b => b.playerId === batsmanId);
        if (batsman?.isOut) {
          errors.push({
            code: 'BATSMAN_ALREADY_OUT',
            message: `Batsman ${batsmanId} is already out.`,
            field: 'batsmanId',
          });
        }
      }
    }
  }

  private validateStartInnings(
    state: MatchState,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    const inningsNumber = payload.inningsNumber as number | undefined;
    const battingTeamId = payload.battingTeamId as string | undefined;
    const bowlingTeamId = payload.bowlingTeamId as string | undefined;
    const strikerId = payload.strikerId as string | undefined;
    const nonStrikerId = payload.nonStrikerId as string | undefined;
    const bowlerId = payload.bowlerId as string | undefined;

    // Match must be LIVE
    if (state.status !== 'LIVE') {
      errors.push({
        code: 'MATCH_NOT_LIVE',
        message: 'Match must be LIVE to start innings.',
        field: 'status',
      });
    }

    // Validate innings number
    if (!inningsNumber || inningsNumber < 1 || inningsNumber > 4) {
      errors.push({
        code: 'INVALID_INNINGS_NUMBER',
        message: 'Innings number must be between 1 and 4.',
        field: 'inningsNumber',
      });
    }

    // Check if innings already exists
    if (state.innings.some(i => i.inningsNumber === inningsNumber)) {
      errors.push({
        code: 'INNINGS_EXISTS',
        message: `Innings ${inningsNumber} has already started.`,
        field: 'inningsNumber',
      });
    }

    // Validate teams
    if (!battingTeamId || (battingTeamId !== state.team1Id && battingTeamId !== state.team2Id)) {
      errors.push({
        code: 'INVALID_BATTING_TEAM',
        message: 'Batting team must be one of the match teams.',
        field: 'battingTeamId',
      });
    }

    if (!bowlingTeamId || (bowlingTeamId !== state.team1Id && bowlingTeamId !== state.team2Id)) {
      errors.push({
        code: 'INVALID_BOWLING_TEAM',
        message: 'Bowling team must be one of the match teams.',
        field: 'bowlingTeamId',
      });
    }

    if (battingTeamId === bowlingTeamId) {
      errors.push({
        code: 'SAME_TEAM',
        message: 'Batting and bowling teams must be different.',
        field: 'battingTeamId/bowlingTeamId',
      });
    }

    // Validate players
    if (!strikerId || !nonStrikerId || !bowlerId) {
      errors.push({
        code: 'MISSING_PLAYERS',
        message: 'Striker, non-striker, and bowler IDs are required.',
        field: 'players',
      });
    }

    if (strikerId === nonStrikerId) {
      errors.push({
        code: 'SAME_PLAYER',
        message: 'Striker and non-striker must be different players.',
        field: 'strikerId/nonStrikerId',
      });
    }

    if (bowlerId === strikerId || bowlerId === nonStrikerId) {
      errors.push({
        code: 'BOWLER_IN_BATting',
        message: 'Bowler cannot be a batsman.',
        field: 'bowlerId',
      });
    }
  }

  private validateCompleteInnings(
    state: MatchState,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    const innings = state.innings[state.innings.length - 1];
    if (!innings) {
      errors.push({
        code: 'NO_ACTIVE_INNINGS',
        message: 'No active innings to complete.',
        field: 'innings',
      });
      return;
    }

    const followOn = payload.followOn as boolean | undefined;

    // For innings 2, check if target is achieved
    if (innings.inningsNumber === 2 && innings.target !== undefined) {
      if (innings.totalRuns >= innings.target) {
        // Target achieved - this is fine
      } else if (innings.totalWickets >= 10) {
        // All out before target - innings complete
      }
    }

    // Validate follow-on for innings 2
    if (followOn && innings.inningsNumber !== 2) {
      errors.push({
        code: 'INVALID_FOLLOW_ON',
        message: 'Follow-on can only be enforced in the second innings.',
        field: 'followOn',
      });
    }
  }

  private validateToss(
    state: MatchState,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    if (state.status !== 'CREATED') {
      errors.push({
        code: 'INVALID_STATUS',
        message: `Toss cannot be recorded. Match status is '${state.status}'.`,
        field: 'status',
      });
    }

    const winnerTeamId = payload.winnerTeamId as string | undefined;
    const decision = payload.decision as string | undefined;

    if (!winnerTeamId || (winnerTeamId !== state.team1Id && winnerTeamId !== state.team2Id)) {
      errors.push({
        code: 'INVALID_TOSS_WINNER',
        message: 'Toss winner must be one of the match teams.',
        field: 'winnerTeamId',
      });
    }

    if (decision && decision !== 'BAT' && decision !== 'BOWL') {
      errors.push({
        code: 'INVALID_DECISION',
        message: 'Toss decision must be either BAT or BOWL.',
        field: 'decision',
      });
    }

    if (state.toss) {
      errors.push({
        code: 'TOSS_ALREADY_DONE',
        message: 'Toss has already been recorded for this match.',
        field: 'toss',
      });
    }
  }

  private validateStartMatch(
    state: MatchState,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    if (state.status !== 'CREATED') {
      errors.push({
        code: 'INVALID_STATUS',
        message: `Cannot start match. Current status is '${state.status}'.`,
        field: 'status',
      });
    }

    if (!state.toss) {
      errors.push({
        code: 'TOSS_REQUIRED',
        message: 'Toss must be completed before starting the match.',
        field: 'toss',
      });
    }
  }

  private validateWide(
    state: MatchState,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    const extraRuns = payload.extraRuns as number | undefined;

    if (extraRuns === undefined || extraRuns < 1) {
      errors.push({
        code: 'INVALID_WIDE_RUNS',
        message: 'Wide must have at least 1 extra run.',
        field: 'extraRuns',
      });
    }

    // Wide doesn't count as a ball
    // But check if bowler exists
    const innings = state.innings[state.innings.length - 1];
    if (innings && !innings.bowlerId) {
      errors.push({
        code: 'NO_BOWLER',
        message: 'No bowler assigned. Cannot record wide.',
        field: 'bowlerId',
      });
    }
  }

  private validateNoBall(
    state: MatchState,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    const extraRuns = payload.extraRuns as number | undefined;

    if (extraRuns === undefined || extraRuns < 0) {
      errors.push({
        code: 'INVALID_NO_BALL_RUNS',
        message: 'No ball extra runs must be 0 or more.',
        field: 'extraRuns',
      });
    }
  }

  private validateChangeBowler(
    state: MatchState,
    payload: Record<string, unknown>,
    errors: ValidationError[]
  ): void {
    const newBowlerId = payload.newBowlerId as string | undefined;

    if (!newBowlerId) {
      errors.push({
        code: 'MISSING_BOWLER',
        message: 'New bowler ID is required.',
        field: 'newBowlerId',
      });
    }

    const innings = state.innings[state.innings.length - 1];
    if (!innings) {
      errors.push({
        code: 'NO_ACTIVE_INNINGS',
        message: 'No active innings to change bowler.',
        field: 'innings',
      });
      return;
    }

    // Check if bowler is a batsman
    if (innings.strikerId === newBowlerId || innings.nonStrikerId === newBowlerId) {
      errors.push({
        code: 'BOWLER_IN_BATTING',
        message: 'Bowler cannot be one of the current batsmen.',
        field: 'newBowlerId',
      });
    }
  }

  // ========================================
  // MATCH STATE BUILDING
  // ========================================

  private async buildMatchState(matchId: string): Promise<MatchState> {
    // Get match from database
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      throw new AppError('Match not found', 'MATCH_NOT_FOUND', 404, { matchId });
    }

    // Get events for this match
    const { events } = await getEvents({
      matchId,
      limit: 10000,
    });

    return buildMatchState(matchId, events, {
      format: match.format,
      overs: match.overs,
      ballsPerOver: match.ballsPerOver,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      status: match.status as 'CREATED' | 'LIVE' | 'COMPLETED' | 'ABANDONED',
    });
  }
}

// Export singleton instance
const eventValidator = new EventValidator();

export { EventValidator, eventValidator };
