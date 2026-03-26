import { MatchStatus, MatchFormat, TossDecision, inningsNumber, TeamType } from '../constants/event-types';
import { TypedEvent } from './event.types';

// Match Entity
export interface Match {
  id: string;
  team1Id: string;
  team2Id: string;
  venue: string;
  startTime: Date;
  endTime?: Date;
  status: MatchStatus;
  format: MatchFormat;
  overs: number;
  ballsPerOver: number;
  currentOver: number;
  currentBall: number;
  tournamentId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Match with Relations
export interface MatchWithRelations extends Match {
  team1: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  team2: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  tournament?: {
    id: string;
    name: string;
  };
  currentInnings?: Innings;
}

// Toss
export interface Toss {
  id: string;
  matchId: string;
  winnerTeamId: string;
  decision: TossDecision;
  timestamp: Date;
}

// innings
export interface Innings {
  id: string;
  matchId: string;
  inningsNumber: inningsNumber;
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  overs: number;
  balls: number;
  runRate: number;
  declared: boolean;
  followsOn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// innings with details
export interface InningsWithDetails extends Innings {
  battingTeam: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  bowlingTeam: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  battingStats: BattingStats[];
  bowlingStats: BowlingStats[];
  fallOfWickets: FallOfWicket[];
}

export interface FallOfWicket {
  wicketNumber: number;
  score: number;
  over: string;
  batsmanId: string;
}

// Batting Performance
export interface BattingStats {
  batsmanId: string;
  batsmanName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal?: string;
  dismissalType?: string;
  fielderId?: string;
  bowlerId?: string;
  position: number;
  isOut: boolean;
  isNotOut: boolean;
  ballsPerFour: number;
  ballsPerSix: number;
}

// Bowling Performance
export interface BowlingStats {
  bowlerId: string;
  bowlerName: string;
  overs: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  dots: number;
  foursConceded: number;
  sixesConceded: number;
  wides: number;
  noBalls: number;
}

// Match Scorecard (Read Model)
export interface Scorecard {
  matchId: string;
  innings1?: InningsWithDetails;
  innings2?: InningsWithDetails;
  innings3?: InningsWithDetails;
  innings4?: InningsWithDetails;
  currentInnings: number;
  matchResult?: MatchResult;
  lastUpdated: Date;
}

export interface MatchResult {
  winner?: string;
  winnerId?: string;
  loser?: string;
  loserId?: string;
  margin?: string;
  marginRuns?: number;
  marginWickets?: number;
  marginOvers?: string;
  isTie: boolean;
  isDraw: boolean;
  isAbandoned: boolean;
  playerOfMatch?: string;
  playerOfMatchId?: string;
}

// Match Create DTO
export interface CreateMatchDTO {
  team1Id: string;
  team2Id: string;
  venue: string;
  startTime: Date;
  format: MatchFormat;
  overs: number;
  tournamentId?: string;
  customRules?: CustomRules;
}

export interface CustomRules {
  maxOversPerBowler?: number;
  ballType?: string;
  pitchType?: string;
  powerplayOvers?: { batting: number; bowling: number };
  deathOvers?: number;
}

// Toss DTO
export interface CreateTossDTO {
  matchId: string;
  winnerTeamId: string;
  decision: TossDecision;
}

// Match Update DTO
export interface UpdateMatchDTO {
  status?: MatchStatus;
  currentOver?: number;
  currentBall?: number;
  endTime?: Date;
}

// Match Query Filters
export interface MatchQueryFilters {
  status?: MatchStatus[];
  teamId?: string;
  tournamentId?: string;
  fromDate?: Date;
  toDate?: Date;
  createdBy?: string;
  limit?: number;
  offset?: number;
}

// Match List Response
export interface MatchListResponse {
  matches: MatchWithRelations[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Match Summary (for live view)
export interface MatchSummary {
  matchId: string;
  team1: {
    id: string;
    name: string;
    logoUrl?: string;
    score: string;
    overs: string;
  };
  team2: {
    id: string;
    name: string;
    logoUrl?: string;
    score: string;
    overs: string;
  };
  status: MatchStatus;
  currentOver: string;
  battingTeam: string;
  lastEvent: string;
  isLive: boolean;
}

export interface MatchEventsResponse {
  matchId: string;
  events: TypedEvent[];
  scorecard: Scorecard;
  summary: MatchSummary;
}
