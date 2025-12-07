import 'dotenv/config';
import app from './app.js';
import { connectDB } from './db.js';

// Grab port from env or default to 3000
const PORT = process.env.PORT || 3000;

// Connect to MongoDB then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
