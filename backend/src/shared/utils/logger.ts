// Logger Utility
// Structured logging with Pino

import pino from 'pino';
import { config } from '../../config/index.js';

// ============================================
// LOGGER CREATION
// ============================================

const logger = pino({
  level: config.logging.level,
  transport:
    config.server.isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  base: {
    env: config.server.env,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// ============================================
// CHILD LOGGERS
// ============================================

export function createLogger(module: string) {
  return logger.child({ module });
}

export const authLogger = createLogger('auth');
export const matchLogger = createLogger('match');
export const matchStateLogger = createLogger('matchState');
export const eventLogger = createLogger('event');
export const eventValidatorLogger = createLogger('eventValidator');
export const commandLogger = createLogger('command');
export const tournamentLogger = createLogger('tournament');
export const socketLogger = createLogger('socket');
export const dbLogger = createLogger('database');
export const redisLogger = createLogger('redis');

export default logger;
