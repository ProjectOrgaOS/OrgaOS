import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './db.js';
import logger from './logger.js';

// Grab port from env or default to 3000
const PORT = process.env.PORT || 3000;

// Why http.createServer?
// Express alone can't handle WebSocket connections.
// We wrap Express in an HTTP server so Socket.io can share the same port.
const server = createServer(app);

// Initialize Socket.io with CORS for our frontend
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Store io on app so controllers can access it via req.app.get('io')
app.set('io', io);

// Map to track userId -> socketId for targeted emissions
const userSockets = new Map();
app.set('userSockets', userSockets);

/**
 * Socket.io Event Logging
 *
 * Logs all socket connections, disconnections, and events for debugging
 * and monitoring purposes. In production, these logs help track:
 * - Active connections and user sessions
 * - Room memberships (project collaborations)
 * - Connection issues and patterns
 */
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected');

  // Register user when they authenticate
  socket.on('register', (userId) => {
    if (userId) {
      userSockets.set(userId, socket.id);
      socket.userId = userId;
      logger.info({ userId, socketId: socket.id }, 'User registered socket');
    }
  });

  // Join a project room for real-time updates
  socket.on('joinProject', (projectId) => {
    socket.join(`project:${projectId}`);
    logger.debug({ socketId: socket.id, projectId }, 'Socket joined project room');
  });

  // Leave a project room
  socket.on('leaveProject', (projectId) => {
    socket.leave(`project:${projectId}`);
    logger.debug({ socketId: socket.id, projectId }, 'Socket left project room');
  });

  socket.on('disconnect', (reason) => {
    // Remove user from map on disconnect
    if (socket.userId) {
      userSockets.delete(socket.userId);
      logger.info({ userId: socket.userId, socketId: socket.id, reason }, 'User disconnected');
    } else {
      logger.debug({ socketId: socket.id, reason }, 'Client disconnected');
    }
  });

  // Log socket errors
  socket.on('error', (error) => {
    logger.error({ socketId: socket.id, err: error }, 'Socket error');
  });
});

// Connect to MongoDB then start the server
connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server started');
    logger.info('Socket.io ready for connections');
  });
}).catch((err) => {
  logger.fatal({ err }, 'Failed to connect to database');
  process.exit(1);
});
