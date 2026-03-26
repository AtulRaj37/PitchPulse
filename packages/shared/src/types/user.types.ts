// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  role: UserRole;
  googleId?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  PLAYER = 'PLAYER',
  SCORER = 'SCORER',
  VIEWER = 'VIEWER',
}

// User Create DTO
export interface CreateUserDTO {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}

// Login DTO
export interface LoginDTO {
  email: string;
  password: string;
}

// Auth Response
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// Token Payload
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Refresh Token Request
export interface RefreshTokenRequest {
  refreshToken: string;
}

// Google OAuth
export interface GoogleOAuthDTO {
  code: string;
  redirectUri: string;
}

export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

// User Update DTO
export interface UpdateUserDTO {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

// User Profile (Public)
export interface UserProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  matchesScored: number;
  tournamentsOrganized: number;
  createdAt: Date;
}

// Password Change DTO
export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Forgot/Reset Password
export interface ForgotPasswordDTO {
  email: string;
}

export interface ResetPasswordDTO {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Session
export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

// User Stats
export interface UserStats {
  totalMatches: number;
  matchesInProgress: number;
  matchesCompleted: number;
  tournamentsOrganized: number;
  totalPlayersManaged: number;
}
