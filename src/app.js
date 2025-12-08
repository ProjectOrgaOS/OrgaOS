import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

// Create the Express app
const app = express();

// Allow frontend to call our API (CORS)
app.use(cors());

// Parse JSON bodies (for POST/PUT requests)
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

export default app;
