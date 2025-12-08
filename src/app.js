import express from 'express';
import authRoutes from './routes/auth.routes.js';

// Create the Express app
const app = express();

// Parse JSON bodies (for POST/PUT requests)
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

export default app;
