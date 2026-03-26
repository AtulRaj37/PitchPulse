// Auth Service
// User authentication, registration, and token management

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../core/db/prisma.js';
import { config } from '../../config/index.js';
import { AppError } from '../../core/middleware/error.middleware.js';
import { authLogger as logger } from '../../shared/utils/logger.js';
import type { User, UserRole } from '@prisma/client';

// ============================================
// TYPES
// ============================================

interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly name: string;
  readonly phone?: string;
}

interface LoginInput {
  readonly email: string;
  readonly password: string;
}

interface AuthResponse {
  readonly user: UserPublic;
  readonly token: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}

interface UserPublic {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly role: UserRole;
}

interface TokenPayload {
  readonly userId: string;
  readonly email: string;
  readonly role: UserRole;
}

// ============================================
// SERVICE
// ============================================

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

/**
 * Register a new user
 */
async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, name, phone } = input;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('User with this email already exists', 'USER_EXISTS', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phone,
      role: 'SCORER',
    },
  });

  logger.info({ userId: user.id, email: user.email }, 'User registered');

  // Generate tokens
  const tokens = await generateTokens(user);

  return {
    user: toPublicUser(user),
    ...tokens,
  };
}

/**
 * Login user
 */
async function login(input: LoginInput, userAgent?: string, ipAddress?: string): Promise<AuthResponse> {
  const { email, password } = input;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user || !user.password) {
    throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
  }

  logger.info({ userId: user.id, email: user.email }, 'User logged in');

  // Generate tokens
  const tokens = await generateTokens(user, userAgent, ipAddress);

  return {
    user: toPublicUser(user),
    ...tokens,
  };
}

/**
 * Refresh access token
 */
async function refreshToken(refreshToken: string): Promise<AuthResponse> {
  // Find session by refresh token
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session) {
    throw new AppError('Invalid refresh token', 'INVALID_REFRESH_TOKEN', 401);
  }

  // Check if session is expired
  if (new Date() > session.expiresAt) {
    // Delete expired session
    await prisma.session.delete({
      where: { id: session.id },
    });
    throw new AppError('Refresh token expired', 'REFRESH_TOKEN_EXPIRED', 401);
  }

  // Generate new tokens
  const tokens = await generateTokens(session.user);

  // Delete old session
  await prisma.session.delete({
    where: { id: session.id },
  });

  logger.info({ userId: session.user.id }, 'Token refreshed');

  return {
    user: toPublicUser(session.user),
    ...tokens,
  };
}

/**
 * Logout user (invalidate session)
 */
async function logout(refreshToken: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { refreshToken },
  });

  logger.info('User logged out');
}

/**
 * Get current user
 */
async function getCurrentUser(userId: string): Promise<UserPublic> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 'USER_NOT_FOUND', 404);
  }

  return toPublicUser(user);
}

/**
 * Update user profile
 */
async function updateProfile(
  userId: string,
  data: { name?: string; phone?: string; avatarUrl?: string }
): Promise<UserPublic> {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  logger.info({ userId }, 'User profile updated');

  return toPublicUser(user);
}

/**
 * Change password
 */
async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.password) {
    throw new AppError('User not found', 'USER_NOT_FOUND', 404);
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new AppError('Current password is incorrect', 'INVALID_PASSWORD', 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  // Invalidate all sessions
  await prisma.session.deleteMany({
    where: { userId },
  });

  logger.info({ userId }, 'Password changed, all sessions invalidated');
}

// ============================================
// TOKEN GENERATION
// ============================================

async function generateTokens(
  user: User,
  userAgent?: string,
  ipAddress?: string
): Promise<{ token: string; refreshToken: string; expiresIn: number }> {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  // Generate access token
  const token = signToken(payload, config.jwt.expiresIn);

  // Generate refresh token
  const refreshToken = generateRefreshToken();

  // Calculate expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  // Store session
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      refreshToken,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  // Parse expiresIn to seconds
  const expiresIn = parseExpiresIn(config.jwt.expiresIn);

  return { token, refreshToken, expiresIn };
}

function signToken(payload: TokenPayload, expiresIn: string): string {
  // @ts-ignore - jsonwebtoken types are overly strict on StringValue for expiresIn
  return jwt.sign(payload as jwt.JwtPayload, config.jwt.secret, { expiresIn });
}

function generateRefreshToken(): string {
  return `rt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
}

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 900;
  }
}

// ============================================
// HELPERS
// ============================================

function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    role: user.role,
  };
}

export {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  type AuthResponse,
  type UserPublic,
  type TokenPayload,
};

const authService = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
};

export default authService;
