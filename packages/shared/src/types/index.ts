// Team Types
export interface Team {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  homeGround?: string;
  captainId?: string;
  viceCaptainId?: string;
  coachId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamWithStats extends Team {
  totalMatches: number;
  wins: number;
  losses: number;
  ties: number;
  noResults: number;
  winPercentage: number;
}

export interface CreateTeamDTO {
  name: string;
  shortName?: string;
  logoUrl?: string;
  homeGround?: string;
}

export interface UpdateTeamDTO {
  name?: string;
  shortName?: string;
  logoUrl?: string;
  homeGround?: string;
  captainId?: string;
  viceCaptainId?: string;
  coachId?: string;
}

export interface TeamPlayer {
  playerId: string;
  playerName: string;
  role: PlayerRole;
  battingStyle?: string;
  bowlingStyle?: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
}

// Player Types
export interface Player {
  id: string;
  userId?: string;
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  role: PlayerRole;
  teamId?: string;
  jerseyNumber?: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum BattingStyle {
  RIGHT_HANDED = 'RIGHT_HANDED',
  LEFT_HANDED = 'LEFT_HANDED',
}

export enum BowlingStyle {
  RIGHT_ARM_FAST = 'RIGHT_ARM_FAST',
  RIGHT_ARM_MEDIUM_FAST = 'RIGHT_ARM_MEDIUM_FAST',
  RIGHT_ARM_MEDIUM = 'RIGHT_ARM_MEDIUM',
  RIGHT_ARM_OFF_SPIN = 'RIGHT_ARM_OFF_SPIN',
  RIGHT_ARM_LEG_SPIN = 'RIGHT_ARM_LEG_SPIN',
  LEFT_ARM_FAST = 'LEFT_ARM_FAST',
  LEFT_ARM_MEDIUM_FAST = 'LEFT_ARM_MEDIUM_FAST',
  LEFT_ARM_SPIN = 'LEFT_ARM_SPIN',
  CHINAMAN = 'CHINAMAN',
  LEG_BREAK = 'LEG_BREAK',
  OFF_BREAK = 'OFF_BREAK',
  GOOGLY = 'GOOGLY',
}

export enum PlayerRole {
  BATSMAN = 'BATSMAN',
  BOWLER = 'BOWLER',
  ALL_ROUNDER = 'ALL_ROUNDER',
  WICKET_KEEPER = 'WICKET_KEEPER',
  WICKET_KEEPER_BATSMAN = 'WICKET_KEEPER_BATSMAN',
}

export interface CreatePlayerDTO {
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  role: PlayerRole;
  teamId?: string;
  jerseyNumber?: number;
}

export interface UpdatePlayerDTO {
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  dateOfBirth?: Date;
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  role?: PlayerRole;
  teamId?: string;
  jerseyNumber?: number;
}

// Player Stats Types
export interface PlayerCareerStats {
  playerId: string;
  playerName: string;
  totalMatches: number;
  innings: number;
  notOuts: number;
  runs: number;
  highestScore: {
    runs: number;
    notOut: boolean;
    matchId: string;
  };
  average: number;
  ballsFaced: number;
  strikeRate: number;
  hundreds: number;
  fifties: number;
  fours: number;
  sixes: number;
  ducks: number;

  // Bowling Stats
  wickets: number;
  ballsBowled: number;
  runsConceded: number;
  bowlingAverage: number;
  economy: number;
  bowlingStrikeRate: number;
  bestBowling: {
    wickets: number;
    runs: number;
    matchId: string;
  };
  fiveWicketHauls: number;
  maidenOvers: number;
}

export interface PlayerMatchStats {
  matchId: string;
  matchDate: Date;
  opponent: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal?: string;
  position: number;
  overs?: number;
  wickets?: number;
  runsConceded?: number;
  economy?: number;
  isManOfMatch: boolean;
}

export interface PlayerTournamentStats {
  tournamentId: string;
  tournamentName: string;
  matches: number;
  runs: number;
  wickets: number;
  average: number;
  strikeRate: number;
  economy: number;
  position: number;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  teamId?: string;
  teamName?: string;
  value: number;
  matches: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export enum LeaderboardType {
  MOST_RUNS = 'MOST_RUNS',
  MOST_WICKETS = 'MOST_WICKETS',
  HIGHEST_STRIKE_RATE = 'HIGHEST_STRIKE_RATE',
  BEST_BOWLING_ECONOMY = 'BEST_BOWLING_ECONOMY',
  MOST_FIFIES = 'MOST_FIFIES',
  MOST_HUNDREDS = 'MOST_HUNDREDS',
  BEST_AVERAGE = 'BEST_AVERAGE',
}
