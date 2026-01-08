/**
 * Test Setup File
 *
 * This file runs before all tests.
 * It configures the test environment and provides utilities.
 */

import 'dotenv/config';

// Set test environment
process.env.NODE_ENV = 'test';

// Use test database if not specified
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/orgaos_test';
}

// Set JWT secret for tests
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key-for-testing';
}

// Suppress console.log during tests (optional)
// Comment out if you need to debug
if (process.env.SUPPRESS_LOGS === 'true') {
  console.log = () => {};
  console.info = () => {};
}
