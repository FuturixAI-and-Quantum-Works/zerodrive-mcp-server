/**
 * Logger mock for testing
 * Prevents pino-pretty transport issues during test execution
 */

import { vi } from 'vitest';

/**
 * Mock logger that does nothing
 */
export const mockLogger = {
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
};

/**
 * Mock child logger creator
 */
export const mockCreateChildLogger = vi.fn(() => mockLogger);

/**
 * Mock log tool execution wrapper
 */
export const mockLogToolExecution = vi.fn(async <T>(_toolName: string, fn: () => Promise<T>) => {
  return fn();
});

/**
 * Mock reset logger function
 */
export const mockResetLogger = vi.fn();

/**
 * Setup logger mocks - call this before importing modules that use logger
 */
export function setupLoggerMock(): void {
  vi.mock('../../src/logging/logger.js', () => ({
    logger: mockLogger,
    createChildLogger: mockCreateChildLogger,
    logToolExecution: mockLogToolExecution,
    resetLogger: mockResetLogger,
  }));
}

/**
 * Reset all logger mocks
 */
export function resetLoggerMocks(): void {
  mockLogger.trace.mockClear();
  mockLogger.debug.mockClear();
  mockLogger.info.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.error.mockClear();
  mockLogger.fatal.mockClear();
  mockCreateChildLogger.mockClear();
  mockLogToolExecution.mockClear();
  mockResetLogger.mockClear();
}
