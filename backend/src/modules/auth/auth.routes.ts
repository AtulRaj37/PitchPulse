// Auth Routes
// Authentication endpoints with rate limiting and validation

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../config/index.js';
import authService from './auth.service.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validateBody,
} from '../../core/validation/schemas.js';
import { verifyToken } from '../../core/middleware/auth.middleware.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { AppError } from '../../core/middleware/error.middleware.js';

// ============================================
// ROUTES
// ============================================

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // ============================================
  // PUBLIC ROUTES
  // ============================================

  fastify.post('/register', {
    preHandler: validateBody(registerSchema),
    schema: {
      description: 'Register a new user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 2 },
          phone: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
                token: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await authService.register(request.body as {
      email: string;
      password: string;
      name: string;
      phone?: string;
    });

    reply.status(201).send({
      success: true,
      data: result,
    });
  }));

  fastify.post('/login', {
    preHandler: validateBody(loginSchema),
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    schema: {
      description: 'Login user',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
                token: { type: 'string' },
                refreshToken: { type: 'string' },
                expiresIn: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.ip;

    const result = await authService.login(
      request.body as { email: string; password: string },
      userAgent,
      ipAddress
    );

    reply.send({
      success: true,
      data: result,
    });
  }));

  /**
   * POST /auth/refresh
   * Refresh access token
   */
  fastify.post('/refresh', {
    preHandler: validateBody(refreshTokenSchema),
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
    schema: {
      description: 'Refresh access token',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await authService.refreshToken(
      (request.body as { refreshToken: string }).refreshToken
    );

    reply.send({
      success: true,
      data: result,
    });
  }));

  // ============================================
  // PROTECTED ROUTES
  // ============================================

  /**
   * POST /auth/logout
   * Logout user
   */
  fastify.post('/logout', {
    preHandler: verifyToken,
    schema: {
      description: 'Logout user',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken?: string };

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    reply.send({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  }));

  /**
   * GET /auth/me
   * Get current user
   */
  fastify.get('/me', {
    preHandler: verifyToken,
    schema: {
      description: 'Get current user',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AppError('Not authenticated', 'NOT_AUTHENTICATED', 401);
    }

    const user = await authService.getCurrentUser(request.user.userId);

    reply.send({
      success: true,
      data: user,
    });
  }));

  /**
   * PATCH /auth/profile
   * Update user profile
   */
  fastify.patch('/profile', {
    preHandler: verifyToken,
    schema: {
      description: 'Update user profile',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          phone: { type: 'string', maxLength: 20 },
          avatarUrl: { type: 'string', format: 'uri' },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AppError('Not authenticated', 'NOT_AUTHENTICATED', 401);
    }

    const user = await authService.updateProfile(
      request.user.userId,
      request.body as { name?: string; phone?: string; avatarUrl?: string }
    );

    reply.send({
      success: true,
      data: user,
    });
  }));

  /**
   * POST /auth/change-password
   * Change password
   */
  fastify.post('/change-password', {
    preHandler: verifyToken,
    schema: {
      description: 'Change password',
      tags: ['auth'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
    },
  }, asyncHandler(async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new AppError('Not authenticated', 'NOT_AUTHENTICATED', 401);
    }

    const { currentPassword, newPassword } = request.body as {
      currentPassword: string;
      newPassword: string;
    };

    await authService.changePassword(request.user.userId, currentPassword, newPassword);

    reply.send({
      success: true,
      data: { message: 'Password changed successfully' },
    });
  }));
}

export default authRoutes;
