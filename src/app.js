import express from 'express';

// Create the Express app
const app = express();

// Parse JSON bodies (for POST/PUT requests)
app.use(express.json());

export default app;
