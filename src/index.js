import app from './app.js';

// Grab port from env or default to 3000
const PORT = process.env.PORT || 3000;

// Start the server
// We keep this separate from app.js so tests can import the app without starting the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
