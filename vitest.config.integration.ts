import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// Load .env.test before running tests
dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./tests/setup.integration.ts'],
    testTimeout: 30000,
    hookTimeout: 30000,
    // Run tests sequentially to avoid API rate limiting
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Retry failed tests once (network issues)
    retry: 1,
  },
});
