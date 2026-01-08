/**
 * Pino Logger Configuration
 *
 * Provides structured logging for the OrgaOS application.
 *
 * In DEVELOPMENT:
 * - Uses pino-pretty for human-readable colored output
 * - Logs at 'debug' level
 * - Shows timestamps in local format
 *
 * In PRODUCTION:
 * - Outputs JSON format for log aggregation (ELK, CloudWatch, etc.)
 * - Logs at 'info' level
 * - Includes request IDs for tracing
 *
 * Usage:
 *   import logger from './logger.js';
 *   logger.info('Server started');
 *   logger.error({ err }, 'Database connection failed');
 */

import pino from 'pino';

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Configure transport based on environment
const transport = isProduction
  ? undefined // JSON output in production
  : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    };

// Create logger instance
const logger = pino({
  // Log level based on environment
  level: isTest ? 'silent' : (isProduction ? 'info' : 'debug'),

  // Base properties included in every log
  base: {
    env: process.env.NODE_ENV || 'development',
  },

  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,

  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'password', 'token'],
    censor: '[REDACTED]',
  },

  // Pretty print in development
  transport,
});

// Log startup info
if (!isTest) {
  logger.info({
    nodeVersion: process.version,
    platform: process.platform,
  }, 'Logger initialized');
}

export default logger;

/**
 * Create a child logger with additional context
 * Useful for adding request-specific or module-specific context
 *
 * @param {object} bindings - Additional context to include in logs
 * @returns {pino.Logger} Child logger instance
 *
 * Example:
 *   const authLogger = createChildLogger({ module: 'auth' });
 *   authLogger.info('User logged in');
 */
export function createChildLogger(bindings) {
  return logger.child(bindings);
}
