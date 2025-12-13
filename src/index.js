import 'dotenv/config';
import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './db.js';

// Grab port from env or default to 3000
const PORT = process.env.PORT || 3000;

// Why http.createServer?
// Express alone can't handle WebSocket connections.
// We wrap Express in an HTTP server so Socket.io can share the same port.
const server = createServer(app);

// Initialize Socket.io with CORS for our frontend
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware: attach io to every request so controllers can emit events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io connection handler (we'll expand this later)
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Connect to MongoDB then start the server
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.io ready for connections`);
  });
});
