// Command Types
// Command-based input for cricket scoring
//
// Design:
// - Commands are user intentions ("score 4 runs")
// - Commands are validated before execution
// - Commands generate one or more events
// - Events are stored atomically

import { EventType, BallType, WicketType, DismissalMode } from '@pitchpulse/shared';

// ============================================
// COMMAND PAYLOADS
// ============================================

export interface ScoreRunCommand {
  readonly matchId: string;
  readonly runs: 0 | 1 | 2 | 3 | 4 | 6;
  readonly batsmanId: string;
  readonly bowlerId: string;
  readonly commentary?: string;
  readonly timestamp: Date;
}

export interface WicketCommand {
  readonly matchId: string;
  readonly batsmanId: string;
  readonly bowlerId: string;
  readonly wicketType: WicketType;
  readonly dismissalMode: DismissalMode;
  readonly fielderId?: string;
  readonly newBatsmanId?: string; // Will come from match players
  readonly commentary?: string;
  readonly timestamp: Date;
}

export interface WideCommand {
  readonly matchId: string;
  readonly bowlerId: string;
  readonly batsmanId: string;
  readonly extraRuns: number; // Min 1
  readonly commentary?: string;
  readonly timestamp: Date;
}

export interface NoBallCommand {
  readonly matchId: string;
  readonly bowlerId: string;
  readonly batsmanId: string;
  readonly extraRuns: number; // 0 or more
  readonly isFreeHit: boolean;
  readonly commentary?: string;
  readonly timestamp: Date;
}

export interface ByeCommand {
  readonly matchId: string;
  readonly batsmanId: string;
  readonly bowlerId: string;
  readonly runs: number;
  readonly commentary?: string;
  readonly timestamp: Date;
}

export interface LegByeCommand {
  readonly matchId: string;
  readonly batsmanId: string;
  readonly bowlerId: string;
  readonly runs: number;
  readonly commentary?: string;
  readonly timestamp: Date;
}

export interface StartInningsCommand {
  readonly matchId: string;
  readonly inningsNumber: 1 | 2 | 3 | 4;
  readonly battingTeamId: string;
  readonly bowlingTeamId: string;
  readonly strikerId: string;
  readonly nonStrikerId: string;
  readonly bowlerId: string;
  readonly timestamp: Date;
}

export interface CompleteInningsCommand {
  readonly matchId: string;
  readonly inningsNumber: 1 | 2 | 3 | 4;
  readonly declared: boolean;
  readonly followOn: boolean;
  readonly timestamp: Date;
}

export interface TossCommand {
  readonly matchId: string;
  readonly winnerTeamId: string;
  readonly decision: 'BAT' | 'BOWL';
  readonly timestamp: Date;
}

export interface StartMatchCommand {
  readonly matchId: string;
  readonly timestamp: Date;
}

export interface CompleteMatchCommand {
  readonly matchId: string;
  readonly winnerTeamId?: string;
  readonly margin?: string; // e.g., "5 wickets", "10 runs"
  readonly playerOfMatch?: string;
  readonly timestamp: Date;
}

export interface AbandonMatchCommand {
  readonly matchId: string;
  readonly reason: string;
  readonly timestamp: Date;
}

export interface ChangeBowlerCommand {
  readonly matchId: string;
  readonly newBowlerId: string;
  readonly timestamp: Date;
}

export interface ChangeStrikerCommand {
  readonly matchId: string;
  readonly newStrikerId: string;
  readonly timestamp: Date;
}

export interface ChangeNonStrikerCommand {
  readonly matchId: string;
  readonly newNonStrikerId: string;
  readonly timestamp: Date;
}

// ============================================
// UNION TYPE
// ============================================

export type CricketCommand =
  | { readonly type: 'SCORE_RUN'; readonly payload: ScoreRunCommand }
  | { readonly type: 'WICKET'; readonly payload: WicketCommand }
  | { readonly type: 'WIDE'; readonly payload: WideCommand }
  | { readonly type: 'NO_BALL'; readonly payload: NoBallCommand }
  | { readonly type: 'BYE'; readonly payload: ByeCommand }
  | { readonly type: 'LEG_BYE'; readonly payload: LegByeCommand }
  | { readonly type: 'START_INNINGS'; readonly payload: StartInningsCommand }
  | { readonly type: 'COMPLETE_INNINGS'; readonly payload: CompleteInningsCommand }
  | { readonly type: 'TOSS'; readonly payload: TossCommand }
  | { readonly type: 'START_MATCH'; readonly payload: StartMatchCommand }
  | { readonly type: 'COMPLETE_MATCH'; readonly payload: CompleteMatchCommand }
  | { readonly type: 'ABANDON_MATCH'; readonly payload: AbandonMatchCommand }
  | { readonly type: 'CHANGE_BOWLER'; readonly payload: ChangeBowlerCommand }
  | { readonly type: 'CHANGE_STRIKER'; readonly payload: ChangeStrikerCommand }
  | { readonly type: 'CHANGE_NON_STRIKER'; readonly payload: ChangeNonStrikerCommand };

// ============================================
// COMMAND RESULT
// ============================================

export interface CommandEvent {
  readonly id: string;        // Client-generated UUID
  readonly eventType: EventType;
  readonly payload: Record<string, unknown>;
  readonly overNumber: number;
  readonly ballNumber: number;
}

export interface CommandResult {
  readonly success: boolean;
  readonly commandId: string;
  readonly events: readonly CommandEvent[];
  readonly matchState?: unknown; // Current match state after command
  readonly timestamp: Date;
}

// ============================================
// EVENT GENERATOR
// Maps commands to events
// ============================================

export interface EventGeneratorContext {
  readonly userId: string;
  readonly source?: string;
  readonly ipAddress?: string;
  readonly matchState: import('../../event-sourcing/match-state/match-state.js').MatchState;
}

// Generate events from a command
export function generateEvents(
  command: CricketCommand,
  context: EventGeneratorContext
): readonly CommandEvent[] {
  const events = _generateEvents(command, context);
  const { matchState } = context;
  const inningsNumber = matchState.innings.length > 0 ? matchState.innings.length : undefined;

  // Inject inningsNumber into every payload so the projector knows which innings to update
  return events.map(e => ({
    ...e,
    payload: {
      ...e.payload,
      ...(inningsNumber !== undefined ? { inningsNumber } : {})
    }
  }));
}

function _generateEvents(
  command: CricketCommand,
  context: EventGeneratorContext
): readonly CommandEvent[] {
  const { matchState } = context;
  const innings = matchState.innings[matchState.innings.length - 1];
  const ballsPerOver = matchState.ballsPerOver;

  // Calculate over and ball numbers
  const currentBalls = innings?.balls ?? 0;
  const overNumber = Math.floor(currentBalls / ballsPerOver);
  const ballNumber = currentBalls % ballsPerOver;

  switch (command.type) {
    case 'SCORE_RUN': {
      const { runs, batsmanId, bowlerId, commentary } = command.payload;
      const isBoundary = runs === 4 || runs === 6;
      const isWicket = runs === 0;
      const isDot = runs === 0;
      const ballType = isDot && !isWicket ? BallType.NORMAL : BallType.NORMAL;
      const needsStrikeRotation = runs % 2 === 1;

      const events: CommandEvent[] = [
        {
          id: crypto.randomUUID(),
          eventType: EventType.BALL_BOWLED,
          payload: {
            bowlerId,
            batsmanId,
            ballType,
            runs,
            isExtra: false,
            commentary,
          },
          overNumber,
          ballNumber,
        },
      ];

      if (runs > 0) {
        events.push({
          id: crypto.randomUUID(),
          eventType: EventType.RUN_SCORED,
          payload: {
            runs,
            batsmanId,
            bowlerId,
            isByes: false,
            isLegByes: false,
          },
          overNumber,
          ballNumber,
        });
      }

      if (isBoundary) {
        events.push({
          id: crypto.randomUUID(),
          eventType: runs === 6 ? EventType.SIX_SCORED : EventType.BOUNDARY_SCORED,
          payload: {
            runs,
            batsmanId,
            bowlerId,
          },
          overNumber,
          ballNumber,
        });
      }

      if (ballNumber === ballsPerOver - 1) {
        // Last ball of over
        events.push({
          id: crypto.randomUUID(),
          eventType: EventType.OVER_COMPLETED,
          payload: {
            bowlerId,
            totalRuns: runs,
            wickets: 0,
            isMaiden: runs === 0,
            isUnofficial: false,
          },
          overNumber,
          ballNumber,
        });
      }

      return events;
    }

    case 'WICKET': {
      const { batsmanId, bowlerId, wicketType, dismissalMode, fielderId, newBatsmanId, commentary } = command.payload;

      const events: CommandEvent[] = [
        {
          id: crypto.randomUUID(),
          eventType: EventType.BALL_BOWLED,
          payload: {
            bowlerId,
            batsmanId,
            ballType: BallType.NORMAL,
            runs: 0,
            isExtra: false,
            commentary,
          },
          overNumber,
          ballNumber,
        },
        {
          id: crypto.randomUUID(),
          eventType: EventType.WICKET_FELL,
          payload: {
            batsmanId,
            bowlerId,
            wicketType,
            dismissalMode,
            fielderId,
            newBatsmanId,
          },
          overNumber,
          ballNumber,
        },
        {
          id: crypto.randomUUID(),
          eventType: EventType.BATSMAN_OUT,
          payload: {
            batsmanId,
            bowlerId,
            wicketType,
            dismissalMode,
            fielderId,
          },
          overNumber,
          ballNumber,
        },
      ];

      if (newBatsmanId) {
        events.push({
          id: crypto.randomUUID(),
          eventType: EventType.NEW_BATSMAN,
          payload: {
            newBatsmanId,
            previousBatsmanId: batsmanId,
          },
          overNumber,
          ballNumber,
        });
      }

      // Over completed on wicket
      if (ballNumber === ballsPerOver - 1) {
        events.push({
          id: crypto.randomUUID(),
          eventType: EventType.OVER_COMPLETED,
          payload: {
            bowlerId,
            totalRuns: 0,
            wickets: 1,
            isMaiden: true,
            isUnofficial: false,
          },
          overNumber,
          ballNumber,
        });
      }

      return events;
    }

    case 'WIDE': {
      const { bowlerId, batsmanId, extraRuns, commentary } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.WIDE_BALL,
          payload: {
            bowlerId,
            batsmanId,
            extraRuns,
            isUnofficial: false,
            commentary,
          },
          overNumber,
          ballNumber: -1, // Wide doesn't count as a ball
        },
      ];
    }

    case 'NO_BALL': {
      const { bowlerId, batsmanId, extraRuns, isFreeHit, commentary } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.NO_BALL,
          payload: {
            bowlerId,
            batsmanId,
            extraRuns,
            isFreeHit,
            commentary,
          },
          overNumber,
          ballNumber: -1, // No ball doesn't count as a legal ball
        },
      ];
    }

    case 'BYE': {
      const { batsmanId, bowlerId, runs, commentary } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.BYE,
          payload: {
            batsmanId,
            bowlerId,
            runs,
            commentary,
          },
          overNumber,
          ballNumber,
        },
      ];
    }

    case 'LEG_BYE': {
      const { batsmanId, bowlerId, runs, commentary } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.LEG_BYE,
          payload: {
            batsmanId,
            bowlerId,
            runs,
            commentary,
          },
          overNumber,
          ballNumber,
        },
      ];
    }

    case 'START_INNINGS': {
      const { inningsNumber, battingTeamId, bowlingTeamId, strikerId, nonStrikerId, bowlerId } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.INNINGS_STARTED,
          payload: {
            inningsNumber,
            battingTeamId,
            bowlingTeamId,
            strikerId,
            nonStrikerId,
            bowlerId,
          },
          overNumber: 0,
          ballNumber: 0,
        },
      ];
    }

    case 'COMPLETE_INNINGS': {
      const { inningsNumber, declared, followOn } = command.payload;
      const currentInnings = matchState.innings.find(i => i.inningsNumber === inningsNumber);

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.INNINGS_COMPLETED,
          payload: {
            inningsNumber,
            battingTeamId: currentInnings?.battingTeamId ?? '',
            totalRuns: currentInnings?.totalRuns ?? 0,
            totalWickets: currentInnings?.totalWickets ?? 0,
            overs: currentInnings?.overs ?? 0,
            runRate: currentInnings?.runRate ?? 0,
            declared,
            followOn,
          },
          overNumber,
          ballNumber,
        },
      ];
    }

    case 'TOSS': {
      const { winnerTeamId, decision } = command.payload;
      const battingTeamId = decision === 'BAT' ? winnerTeamId : (winnerTeamId === matchState.team1Id ? matchState.team2Id : matchState.team1Id);
      const bowlingTeamId = decision === 'BOWL' ? winnerTeamId : (winnerTeamId === matchState.team1Id ? matchState.team2Id : matchState.team1Id);

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.TOSS_COMPLETED,
          payload: {
            winnerTeamId,
            decision,
            battingTeamId,
            bowlingTeamId,
          },
          overNumber: 0,
          ballNumber: 0,
        },
      ];
    }

    case 'START_MATCH': {
      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.MATCH_STARTED,
          payload: {},
          overNumber: 0,
          ballNumber: 0,
        },
      ];
    }

    case 'COMPLETE_MATCH': {
      const { winnerTeamId, margin, playerOfMatch } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.MATCH_COMPLETED,
          payload: {
            winnerTeamId,
            margin,
            playerOfMatch,
          },
          overNumber,
          ballNumber,
        },
      ];
    }

    case 'ABANDON_MATCH': {
      const { reason } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.MATCH_ABANDONED,
          payload: { reason },
          overNumber,
          ballNumber,
        },
      ];
    }

    case 'CHANGE_BOWLER': {
      const { newBowlerId } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.BOWLER_CHANGED,
          payload: {
            newBowlerId,
            previousBowlerId: innings?.bowlerId,
          },
          overNumber,
          ballNumber,
        },
      ];
    }

    case 'CHANGE_STRIKER': {
      const { newStrikerId } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.NEW_BATSMAN,
          payload: {
            newBatsmanId: newStrikerId,
            previousBatsmanId: innings?.strikerId,
          },
          overNumber,
          ballNumber,
        },
      ];
    }

    case 'CHANGE_NON_STRIKER': {
      const { newNonStrikerId } = command.payload;

      return [
        {
          id: crypto.randomUUID(),
          eventType: EventType.NEW_BATSMAN,
          payload: {
            // HACK: We reuse NEW_BATSMAN, but we might need a custom event for non-striker in match-state
            newBatsmanId: newNonStrikerId,
            isNonStriker: true,
            previousBatsmanId: innings?.nonStrikerId,
          },
          overNumber,
          ballNumber,
        },
      ];
    }

    default:
      return [];
  }
}
