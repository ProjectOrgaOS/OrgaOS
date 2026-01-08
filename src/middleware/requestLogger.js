/**
 * Request Logger Middleware
 *
 * Provides HTTP request/response logging using pino-http.
 *
 * Features:
 * - Logs all incoming requests with method, URL, and status
 * - Automatically adds request ID for tracing
 * - Logs response time for performance monitoring
 * - Redacts sensitive headers (Authorization)
 * - Customized log levels based on status codes
 *
 * Production Usage:
 * - JSON logs can be piped to log aggregators (ELK, Datadog, etc.)
 * - Request IDs enable distributed tracing
 * - Response times help identify slow endpoints
 *
 * Example output (production):
 * {"level":30,"time":1234567890,"req":{"method":"POST","url":"/api/auth/login"},"res":{"statusCode":200},"responseTime":45,"msg":"request completed"}
 */

import pinoHttp from 'pino-http';
import logger from '../logger.js';

// Create HTTP logger middleware
const requestLogger = pinoHttp({
  // Use our configured logger
  logger,

  // Generate unique request IDs
  genReqId: (req) => {
    return req.headers['x-request-id'] || crypto.randomUUID();
  },

  // Customize what gets logged for requests
  customReceivedMessage: (req) => {
    return `${req.method} ${req.url}`;
  },

  // Customize what gets logged for responses
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} - ${res.statusCode}`;
  },

  // Customize error messages
  customErrorMessage: (req, res, error) => {
    return `${req.method} ${req.url} - ${res.statusCode} - ${error.message}`;
  },

  // Determine log level based on response status code
  customLogLevel: (req, res, error) => {
    if (error || res.statusCode >= 500) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },

  // Customize what request data to log
  customProps: (req, res) => {
    return {
      // Add user ID if authenticated
      userId: req.user?.userId,
      // Add response time category for quick filtering
      responseTimeCategory: categorizeResponseTime(res.responseTime),
    };
  },

  // Serialize request data
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      query: req.query,
      // Don't log body by default (could contain sensitive data)
      // Uncomment below to log body for debugging
      // body: req.body,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: (err) => ({
      type: err.constructor.name,
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    }),
  },

  // Don't log certain paths (health checks, static files)
  autoLogging: {
    ignore: (req) => {
      const ignorePaths = ['/health', '/favicon.ico', '/robots.txt'];
      return ignorePaths.includes(req.url);
    },
  },
});

/**
 * Categorize response time for filtering
 */
function categorizeResponseTime(ms) {
  if (ms < 100) return 'fast';
  if (ms < 500) return 'normal';
  if (ms < 1000) return 'slow';
  return 'very_slow';
}

export default requestLogger;
