// Async Handler Wrapper
// Wraps async route handlers to catch errors and pass to error handler

import type { FastifyRequest, FastifyReply, RouteShorthandOptions, FastifyInstance, RouteGenericInterface } from 'fastify';
import { AppError } from '../../core/middleware/error.middleware.js';

// ============================================
// TYPES
// ============================================

type AsyncRequestHandler<T extends RouteGenericInterface = RouteGenericInterface> = (
  request: FastifyRequest<T>,
  reply: FastifyReply
) => Promise<void>;

// ============================================
// ASYNC WRAPPER
// ============================================

/**
 * Wraps an async route handler to catch errors
 * Errors are automatically passed to Fastify's error handler
 */
export function asyncHandler<T extends RouteGenericInterface = RouteGenericInterface>(
  handler: AsyncRequestHandler<T>
): any {
  return async (request: FastifyRequest<T>, reply: FastifyReply) => {
    try {
      await handler(request, reply);
    } catch (error) {
      // Let Fastify handle the error
      if (error instanceof AppError) {
        throw error;
      }
      // Wrap unexpected errors
      throw new AppError(
        error instanceof Error ? error.message : 'Unknown error',
        'INTERNAL_ERROR',
        500
      );
    }
  };
}

// ============================================
// ROUTE HELPER
// ============================================

/**
 * Helper to create a typed route with async handler
 */
export function createRoute<T extends RouteGenericInterface = RouteGenericInterface>(
  handler: AsyncRequestHandler<T>
): any {
  return asyncHandler<T>(handler);
}
