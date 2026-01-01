/**
 * Global test setup for Vitest
 * This file runs before all test files
 */

import { afterAll, beforeEach, vi } from 'vitest';

// Set up environment variables for testing BEFORE any other imports
process.env.ZERODRIVE_API_KEY = 'test-api-key';
process.env.ZERODRIVE_BASE_URL = 'https://api.test.zerodrive.com';
process.env.LOG_LEVEL = 'silent';
process.env.NODE_ENV = 'test';

// Mock the logger module to prevent pino-pretty transport issues
vi.mock('../src/logging/logger.js', () => ({
  logger: {
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  },
  createChildLogger: vi.fn(() => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  })),
  logToolExecution: vi.fn(async <T>(_toolName: string, fn: () => Promise<T>) => fn()),
  resetLogger: vi.fn(),
}));

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

// Re-export commonly used test utilities for convenience
export * from './mocks/fetch.mock.js';
export * from './mocks/entities.mock.js';
export * from './mocks/responses.mock.js';
export * from './helpers/test-utils.js';
