/**
 * Fetch mock utilities for testing HTTP requests
 */

import { vi, type Mock } from 'vitest';

/**
 * Options for creating mock responses
 */
export interface MockResponseOptions {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  json?: unknown;
  text?: string;
}

/**
 * Create a mock Response object
 */
export function createMockResponse(options: MockResponseOptions = {}): Response {
  const { status = 200, statusText = 'OK', headers = {}, json, text } = options;

  const responseHeaders = new Headers({
    'content-type': json !== undefined ? 'application/json' : 'text/plain',
    ...headers,
  });

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: responseHeaders,
    json: async () => json,
    text: async () => (text !== undefined ? text : JSON.stringify(json)),
    clone: function () {
      return createMockResponse(options);
    },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
  } as Response;
}

/**
 * Mock fetch to resolve with a specific response once
 */
export function mockFetchOnce(options: MockResponseOptions): Mock {
  return vi.mocked(global.fetch).mockResolvedValueOnce(createMockResponse(options));
}

/**
 * Mock fetch to reject with an error once
 */
export function mockFetchError(error: Error): Mock {
  return vi.mocked(global.fetch).mockRejectedValueOnce(error);
}

/**
 * Sequence response options
 */
export interface SequenceResponseOptions {
  ok: boolean;
  status: number;
  data?: unknown;
  headers?: Record<string, string>;
}

/**
 * Mock fetch with a sequence of responses
 * Each response can be either success or error
 */
export function mockFetchSequence(responses: SequenceResponseOptions[]): void {
  const mockFn = vi.mocked(global.fetch);
  responses.forEach((response) => {
    const mockResponse = createMockResponse({
      status: response.status,
      json: response.data,
      headers: response.headers,
    });
    mockFn.mockResolvedValueOnce(mockResponse);
  });
}

/**
 * Mock fetch for successful JSON response
 */
export function mockFetchSuccess<T>(data: T, status: number = 200): Mock {
  return mockFetchOnce({ status, json: data });
}

/**
 * Mock fetch for error response
 */
export function mockFetchErrorResponse(status: number, message: string, code?: string): Mock {
  return mockFetchOnce({
    status,
    json: {
      message,
      code,
      statusCode: status,
    },
  });
}

/**
 * Mock fetch to reject with a network error
 */
export function mockFetchNetworkError(message: string = 'Network error'): Mock {
  return vi.mocked(global.fetch).mockRejectedValueOnce(new TypeError(`fetch failed: ${message}`));
}

/**
 * Parsed fetch call details
 */
export interface FetchCallDetails {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  rawBody: string | undefined;
}

/**
 * Get details of a specific fetch call
 */
export function getFetchCallDetails(callIndex: number = 0): FetchCallDetails {
  const calls = vi.mocked(global.fetch).mock.calls;
  if (callIndex >= calls.length) {
    throw new Error(`No fetch call at index ${callIndex}. Total calls: ${calls.length}`);
  }
  const [url, options] = calls[callIndex];
  const rawBody = options?.body as string | undefined;

  let body: unknown;
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody;
    }
  }

  return {
    url: url as string,
    method: (options?.method as string) ?? 'GET',
    headers: (options?.headers as Record<string, string>) ?? {},
    body,
    rawBody,
  };
}

/**
 * Get all fetch calls as structured data
 */
export function getAllFetchCalls(): Array<{
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
}> {
  return vi.mocked(global.fetch).mock.calls.map(([url, options]) => {
    let body: unknown;
    if (options?.body) {
      try {
        body = JSON.parse(options.body as string);
      } catch {
        body = options.body;
      }
    }
    return {
      url: url as string,
      method: (options?.method as string) ?? 'GET',
      headers: (options?.headers as Record<string, string>) ?? {},
      body,
    };
  });
}

/**
 * Assert fetch was called with specific URL pattern
 */
export function assertFetchCalledWith(options: {
  url?: string | RegExp;
  method?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}): void {
  const calls = getAllFetchCalls();

  const matchingCall = calls.find((call) => {
    if (options.url) {
      const urlMatch =
        options.url instanceof RegExp ? options.url.test(call.url) : call.url.includes(options.url);
      if (!urlMatch) return false;
    }

    if (options.method && call.method !== options.method) {
      return false;
    }

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        if (call.headers[key] !== value) return false;
      }
    }

    if (options.body) {
      const callBody = call.body as Record<string, unknown>;
      for (const [key, value] of Object.entries(options.body)) {
        if (callBody?.[key] !== value) return false;
      }
    }

    return true;
  });

  if (!matchingCall) {
    const callsSummary = calls.map((c) => `${c.method} ${c.url}`).join('\n  ');
    throw new Error(
      `Expected fetch call matching ${JSON.stringify(options)} not found.\nActual calls:\n  ${callsSummary || '(none)'}`
    );
  }
}

/**
 * Assert fetch was called N times
 */
export function assertFetchCalledTimes(times: number): void {
  const actualTimes = vi.mocked(global.fetch).mock.calls.length;
  if (actualTimes !== times) {
    throw new Error(
      `Expected fetch to be called ${times} times, but was called ${actualTimes} times`
    );
  }
}

/**
 * Reset fetch mock
 */
export function resetFetchMock(): void {
  vi.mocked(global.fetch).mockReset();
}
