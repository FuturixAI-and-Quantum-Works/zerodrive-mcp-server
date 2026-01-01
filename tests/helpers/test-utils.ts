/**
 * Common test utilities
 */

import { vi } from 'vitest';

/**
 * Wait for a condition to be true with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const start = Date.now();

  while (!(await condition())) {
    if (Date.now() - start > timeout) {
      throw new Error(`Timeout waiting for condition after ${timeout}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Create a deferred promise for testing async flows
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/**
 * Assert that a promise rejects with a specific error type
 */
export async function expectErrorType<T extends Error>(
  promise: Promise<unknown>,
  ErrorClass: new (...args: unknown[]) => T
): Promise<T> {
  try {
    await promise;
    throw new Error(`Expected ${ErrorClass.name} but promise resolved successfully`);
  } catch (error) {
    if (error instanceof ErrorClass) {
      return error;
    }
    throw new Error(
      `Expected ${ErrorClass.name} but got ${error instanceof Error ? error.constructor.name : typeof error}`
    );
  }
}

/**
 * Measure async operation duration
 */
export async function measureDuration<T>(
  operation: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  const result = await operation();
  return { result, durationMs: Date.now() - start };
}

/**
 * Execute a function with temporary environment variables
 */
export async function withEnvVars(
  vars: Record<string, string | undefined>,
  fn: () => void | Promise<void>
): Promise<void> {
  const originalVars: Record<string, string | undefined> = {};

  // Save original values and set new values
  for (const [key, value] of Object.entries(vars)) {
    originalVars[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    await fn();
  } finally {
    // Restore original values
    for (const [key, value] of Object.entries(originalVars)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

/**
 * Create a mock function that tracks calls and can be resolved/rejected later
 */
export function createControllableMock<T>(): {
  mock: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  calls: number;
} {
  let callCount = 0;
  const deferreds: Array<{
    resolve: (value: T) => void;
    reject: (error: Error) => void;
  }> = [];

  const mock = vi.fn(() => {
    callCount++;
    const deferred = createDeferred<T>();
    deferreds.push({ resolve: deferred.resolve, reject: deferred.reject });
    return deferred.promise;
  });

  return {
    mock,
    resolve: (value: T) => {
      const deferred = deferreds.shift();
      if (deferred) {
        deferred.resolve(value);
      }
    },
    reject: (error: Error) => {
      const deferred = deferreds.shift();
      if (deferred) {
        deferred.reject(error);
      }
    },
    get calls() {
      return callCount;
    },
  };
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run multiple promises concurrently and collect results
 */
export async function runConcurrent<T>(
  tasks: Array<() => Promise<T>>,
  options: { maxConcurrent?: number } = {}
): Promise<T[]> {
  const { maxConcurrent = tasks.length } = options;
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then((result) => {
      results.push(result);
    });

    executing.push(p);

    if (executing.length >= maxConcurrent) {
      await Promise.race(executing);
      // Remove completed promises
      const completed = executing.filter(
        (p) =>
          p.then(() => true).catch(() => true) as unknown as boolean
      );
      for (const c of completed) {
        const index = executing.indexOf(c);
        if (index > -1) {
          executing.splice(index, 1);
        }
      }
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Generate a random string
 */
export function randomString(length: number = 8): string {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length);
}

/**
 * Generate a test email
 */
export function randomEmail(): string {
  return `test-${randomString()}@example.com`;
}

/**
 * Generate a valid hex color
 */
export function randomHexColor(): string {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
}

/**
 * Create a test context that tracks resources for cleanup
 */
export function createTestContext(): {
  files: string[];
  folders: string[];
  workspaces: string[];
  trackFile: (id: string) => void;
  trackFolder: (id: string) => void;
  trackWorkspace: (id: string) => void;
  getTracked: () => { files: string[]; folders: string[]; workspaces: string[] };
  clear: () => void;
} {
  const files: string[] = [];
  const folders: string[] = [];
  const workspaces: string[] = [];

  return {
    files,
    folders,
    workspaces,
    trackFile: (id: string) => files.push(id),
    trackFolder: (id: string) => folders.push(id),
    trackWorkspace: (id: string) => workspaces.push(id),
    getTracked: () => ({ files: [...files], folders: [...folders], workspaces: [...workspaces] }),
    clear: () => {
      files.length = 0;
      folders.length = 0;
      workspaces.length = 0;
    },
  };
}
