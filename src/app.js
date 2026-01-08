import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import userRoutes from './routes/user.routes.js';
import eventRoutes from './routes/event.routes.js';
import requestLogger from './middleware/requestLogger.js';
import logger from './logger.js';

// Create the Express app
const app = express();

// Make logger available throughout app
app.set('logger', logger);

// Allow frontend to call our API (CORS)
app.use(cors());

// Parse JSON bodies (for POST/PUT requests)
app.use(express.json());

/**
 * Request Logging Middleware
 *
 * In production (NODE_ENV=production):
 * - Outputs JSON logs for log aggregators (ELK, Datadog, Splunk)
 * - Each request gets a unique ID for distributed tracing
 * - Logs include: method, URL, status code, response time
 * - Pipe output: node src/index.js | your-log-shipper
 *
 * In development:
 * - Uses pino-pretty for readable console output
 * - Run with: npm run dev (pipes through pino-pretty)
 */
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

/**
 * Global Error Handler
 *
 * Catches all unhandled errors and logs them with full context.
 * In production, stack traces are hidden from responses but logged.
 */
app.use((err, req, res, next) => {
  // Log error with request context
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      userId: req.user?.userId,
    },
  }, 'Unhandled error');

  // Send error response (hide details in production)
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

export default app;
