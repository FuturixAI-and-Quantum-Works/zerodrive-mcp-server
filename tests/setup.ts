/**
 * Global test setup for Vitest
 * This file runs before all test files
 */

import { afterAll, beforeEach, vi } from 'vitest';

// Set up environment variables for testing
process.env.ZERODRIVE_API_KEY = 'test-api-key';
process.env.ZERODRIVE_BASE_URL = 'https://api.test.zerodrive.com';
process.env.LOG_LEVEL = 'silent';

// Global mock for fetch
global.fetch = vi.fn();

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
  vi.restoreAllMocks();
});
