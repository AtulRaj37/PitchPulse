// Error Handling Middleware
// Centralized error handling with proper HTTP status codes

import type { FastifyRequest, FastifyReply, FastifyInstance, HookHandlerDoneFunction } from 'fastify';
import { ZodError } from 'zod';
import { config } from '../../config/index.js';

// ============================================
// ERROR TYPES
// ============================================

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with id '${identifier}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly errors?: Array<{ field: string; message: string }>
  ) {
    super(message, 'VALIDATION_ERROR', 400, errors);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class ConcurrencyError extends AppError {
  constructor(message: string = 'Resource was modified by another request') {
    super(message, 'CONCURRENCY_ERROR', 409);
    this.name = 'ConcurrencyError';
  }
}

export class IdempotencyError extends AppError {
  constructor(eventId: string) {
    super(`Event with id '${eventId}' already exists`, 'IDEMPOTENCY_ERROR', 409);
    this.name = 'IdempotencyError';
  }
}

// ============================================
// ERROR SERIALIZATION
// ============================================

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
  timestamp: string;
  requestId?: string;
}

function serializeError(error: Error, request?: FastifyRequest): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    timestamp: new Date().toISOString(),
  };

  if (error instanceof AppError) {
    response.error.code = error.code;
    response.error.message = error.message;
    if (error.details) {
      response.error.details = error.details;
    }
  } else if (error instanceof ZodError) {
    response.error.code = 'VALIDATION_ERROR';
    response.error.message = 'Invalid request data';
    response.error.details = error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  } else if (error.name === 'SyntaxError') {
    response.error.code = 'PARSE_ERROR';
    response.error.message = 'Invalid JSON';
  } else {
    response.error.code = 'INTERNAL_ERROR';
    response.error.message = config.server.isDev ? error.message : 'An unexpected error occurred';
  }

  // Add request ID if available
  if (request?.id) {
    response.requestId = request.id;
  }

  // Add stack trace in development
  if (config.server.isDev && error.stack) {
    response.error.stack = error.stack;
  }

  return response;
}

// ============================================
// ERROR HANDLERS
// ============================================

function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const statusCode =
    error instanceof AppError ? error.statusCode : 500;

  // Log error
  if (statusCode >= 500) {
    request.log.error(error);
  } else if (statusCode >= 400) {
    request.log.warn(error.message);
  }

  const response = serializeError(error, request);
  reply.status(statusCode).send(response);
}

function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const error = new NotFoundError('Route', request.url);
  const response = serializeError(error, request);
  reply.status(404).send(response);
}

// ============================================
// VALIDATION ERROR HOOK
// ============================================

function validationErrorHandler(
  this: FastifyRequest,
  error: ZodError,
  _done: HookHandlerDoneFunction
): void {
  const validationError = new ValidationError('Invalid request parameters', error.errors.map((e) => ({
    field: e.path.join('.'),
    message: e.message,
  })));

  throw validationError;
}

// ============================================
// PLUGIN
// ============================================

async function errorPlugin(fastify: FastifyInstance): Promise<void> {
  // Set custom error handler
  fastify.setErrorHandler(errorHandler);

  // Set not found handler
  fastify.setNotFoundHandler(notFoundHandler);

  // Custom validation error handler for schema validation
  fastify.setSchemaErrorFormatter((errors, _dataVar) => {
    return new ValidationError(
      'Request validation failed',
      errors.map((e) => ({
        field: (e.instancePath || e.params?.missingProperty || 'unknown') as string,
        message: e.message || 'Invalid value',
      }))
    );
  });
}

export {
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
  serializeError,
};

export default errorPlugin;
