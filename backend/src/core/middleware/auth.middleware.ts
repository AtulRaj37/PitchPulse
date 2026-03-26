// Authentication Middleware
// JWT token verification and user authentication

import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { config } from '../../config/index.js';

// ============================================
// TYPES
// ============================================

interface JWTPayload {
  readonly userId: string;
  readonly email: string;
  readonly role: 'ADMIN' | 'ORGANIZER' | 'PLAYER' | 'SCORER' | 'VIEWER';
  readonly iat: number;
  readonly exp: number;
}


declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JWTPayload;
    user: JWTPayload;
  }
}

// ============================================
// HELPERS
// ============================================

import jwt from 'jsonwebtoken';

/**
 * Verify JWT token and attach user to request
 */
async function verifyToken(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Authentication required');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw new AuthenticationError('Invalid authorization format');
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    // Validate that the token has an actual userId schema
    if (!payload || !payload.userId) {
      throw new Error('Valid token signature but missing payload userId schema');
    }
    
    request.user = payload;
  } catch (error: any) {
    console.error('======================================');
    console.error('[CRITICAL AUTH REJECTION TRACE]');
    console.error('Received Token Prefix:', token.substring(0, 20) + '...');
    console.error('Error Name:', error?.name);
    console.error('Error Message:', error?.message);
    console.error('======================================');
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
        request.user = payload;
      } catch {
        // Ignore errors for optional auth
      }
    }
  }
}

/**
 * Check if user has required role
 */
function requireRole(...allowedRoles: Array<'ADMIN' | 'ORGANIZER' | 'PLAYER' | 'SCORER' | 'VIEWER'>) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }
  };
}

/**
 * Check if user is match creator or scorer
 */
async function requireMatchAccess(
  request: FastifyRequest,
  reply: FastifyReply,
  matchId: string
): Promise<void> {
  if (!request.user) {
    throw new AuthenticationError('Authentication required');
  }

  // Admin has full access
  if (request.user.role === 'ADMIN') {
    return;
  }

  // TODO: Check if user is match creator or has scorer role
  // This will be implemented in the match module
  if (request.user.role !== 'SCORER') {
    throw new AuthorizationError('Only scorers can modify matches');
  }
}

// ============================================
// CUSTOM ERRORS
// ============================================

import { AppError } from './error.middleware.js';

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 'FORBIDDEN', 403);
    this.name = 'AuthorizationError';
  }
}

// ============================================
// PLUGIN
// ============================================

import fp from 'fastify-plugin';

async function authPlugin(fastify: FastifyInstance): Promise<void> {
  // Register JWT plugin
  await fastify.register(import('@fastify/jwt'), {
    secret: config.jwt.secret,
    sign: {
      expiresIn: config.jwt.expiresIn,
    },
  });

  // Add authentication hook
  fastify.decorate('authenticate', verifyToken);
  fastify.decorate('optionalAuth', optionalAuth);
  fastify.decorate('requireRole', requireRole);
  fastify.decorate('requireMatchAccess', requireMatchAccess);
}

export default fp(authPlugin);

export { verifyToken, optionalAuth, requireRole };

// Alias verifyToken as requireAuth for convenience
export const requireAuth = verifyToken;
