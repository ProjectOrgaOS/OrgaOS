import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use global test functions (describe, it, expect) without imports
    globals: true,

    // Node environment for backend tests
    environment: 'node',

    // Test file patterns
    include: ['tests/**/*.test.js'],

    // Exclude node_modules
    exclude: ['node_modules', 'frontend'],

    // Setup files to run before tests
    setupFiles: ['./tests/setup.js'],

    // Timeout for async tests (10 seconds for DB operations)
    testTimeout: 10000,

    // Run tests sequentially to avoid DB conflicts
    sequence: {
      shuffle: false,
    },

    // Coverage configuration
    coverage: {
      // Use v8 for faster coverage
      provider: 'v8',

      // Generate coverage reports
      reporter: ['text', 'json', 'html', 'lcov'],

      // Coverage thresholds - fail if below these values
      thresholds: {
        lines: 80,
        branches: 70,
        functions: 75,
        statements: 80,
      },

      // Include source files
      include: ['src/**/*.js'],

      // Exclude from coverage
      exclude: [
        'src/index.js',      // Entry point (starts server)
        'src/db.js',         // DB connection
        'node_modules/**',
      ],

      // Report files not covered
      all: true,
    },
  },
});
