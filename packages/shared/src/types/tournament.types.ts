import { MatchFormat, MatchStatus } from '../constants/event-types';

// Tournament Entity
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  format: MatchFormat;
  overs: number;
  maxOversPerBowler?: number;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  maxTeams: number;
  minTeams: number;
  status: TournamentStatus;
  rules?: TournamentRules;
  prizeMoney?: string;
  venue?: string;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface TournamentRules {
  powerplayOvers?: { batting: number; bowling: number };
  maxOversPerBowler?: number;
  ballType?: string;
  winPoints: number;
  tiePoints: number;
  lossPoints: number;
  noResultPoints: number;
  superOver: boolean;
  DuckworthLewis: boolean;
  maxTeamSize: number;
  minTeamSize: number;
  reserveDay: boolean;
}

// Tournament with Relations
export interface TournamentWithRelations extends Tournament {
  organizer: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  teams: TournamentTeam[];
  totalMatches: number;
  completedMatches: number;
}

// Tournament Team
export interface TournamentTeam {
  teamId: string;
  teamName: string;
  teamLogo?: string;
  groupName?: string;
  registeredAt: Date;
  status: TeamTournamentStatus;
}

export enum TeamTournamentStatus {
  REGISTERED = 'REGISTERED',
  CONFIRMED = 'CONFIRMED',
  ELIMINATED = 'ELIMINATED',
  WINNER = 'WINNER',
  RUNNER_UP = 'RUNNER_UP',
}

// Points Table Entry
export interface PointsTableEntry {
  rank: number;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  netRunRate: number;
  runsScored: number;
  runsConceded: number;
  oversFaced: number;
  oversBowled: number;
}

// Tournament Create DTO
export interface CreateTournamentDTO {
  name: string;
  description?: string;
  format: MatchFormat;
  overs: number;
  startDate: Date;
  endDate: Date;
  registrationDeadline?: Date;
  maxTeams: number;
  minTeams?: number;
  venue?: string;
  prizeMoney?: string;
  rules?: TournamentRules;
}

// Tournament Update DTO
export interface UpdateTournamentDTO {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  status?: TournamentStatus;
  venue?: string;
  prizeMoney?: string;
  rules?: TournamentRules;
}

// Fixture
export interface Fixture {
  id: string;
  tournamentId: string;
  matchId?: string;
  round: number;
  matchNumber: number;
  team1Id?: string;
  team2Id?: string;
  winnerId?: string;
  scheduledDate?: Date;
  venue?: string;
  status: FixtureStatus;
}

export enum FixtureStatus {
  TBD = 'TBD',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Group
export interface Group {
  id: string;
  tournamentId: string;
  name: string;
  teams: string[];
}

// Bracket Structure
export interface BracketStage {
  round: number;
  name: string;
  matches: BracketMatch[];
}

export interface BracketMatch {
  matchNumber: number;
  team1?: { id: string; name: string };
  team2?: { id: string; name: string };
  winner?: string;
  score?: string;
  nextMatchId?: string;
}

// Tournament Query Filters
export interface TournamentQueryFilters {
  status?: TournamentStatus[];
  format?: MatchFormat;
  fromDate?: Date;
  toDate?: Date;
  organizerId?: string;
  limit?: number;
  offset?: number;
}

// Tournament List Response
export interface TournamentListResponse {
  tournaments: TournamentWithRelations[];
  total: number;
  hasMore: boolean;
  nextOffset?: number;
}

// Match Fixture in Tournament
export interface TournamentMatch {
  matchId: string;
  fixtureId: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  team1: { id: string; name: string; logoUrl?: string };
  team2: { id: string; name: string; logoUrl?: string };
  scheduledDate: Date;
  venue?: string;
  status: MatchStatus;
  result?: {
    winnerId: string;
    margin: string;
  };
}
