/**
 * Unit tests for API client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  apiRequest,
  get,
  post,
  put,
  patch,
  del,
  apiRequestWithRetry,
} from '../../../src/api/client.js';
import {
  mockFetchSuccess,
  mockFetchErrorResponse,
  mockFetchNetworkError,
  mockFetchSequence,
  assertFetchCalledWith,
  getFetchCallDetails,
} from '../../mocks/fetch.mock.js';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ApiError,
  NetworkError,
} from '../../../src/errors/base.js';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('apiRequest', () => {
    describe('Request construction', () => {
      it('should include Authorization header', async () => {
        mockFetchSuccess({ data: 'test' });

        await apiRequest('/api/v1/test');

        const { headers } = getFetchCallDetails();
        expect(headers?.['Authorization']).toMatch(/^Bearer /);
      });

      it('should build URL with base URL', async () => {
        mockFetchSuccess({ data: 'test' });

        await apiRequest('/api/v1/test');

        const { url } = getFetchCallDetails();
        expect(url).toContain('/api/v1/test');
      });

      it('should append query parameters', async () => {
        mockFetchSuccess({ data: 'test' });

        await apiRequest('/api/v1/test', {
          query: { limit: 50, offset: 10 },
        });

        const { url } = getFetchCallDetails();
        expect(url).toContain('limit=50');
        expect(url).toContain('offset=10');
      });

      it('should skip undefined query parameters', async () => {
        mockFetchSuccess({ data: 'test' });

        await apiRequest('/api/v1/test', {
          query: { limit: 50, offset: undefined },
        });

        const { url } = getFetchCallDetails();
        expect(url).toContain('limit=50');
        expect(url).not.toContain('offset');
      });

      it('should set Content-Type for JSON body', async () => {
        mockFetchSuccess({ data: 'test' });

        await apiRequest('/api/v1/test', {
          method: 'POST',
          body: { name: 'test' },
        });

        const { headers } = getFetchCallDetails();
        expect(headers['Content-Type']).toBe('application/json');
      });

      it('should stringify JSON body', async () => {
        mockFetchSuccess({ data: 'test' });

        await apiRequest('/api/v1/test', {
          method: 'POST',
          body: { name: 'test' },
        });

        const { rawBody } = getFetchCallDetails();
        expect(rawBody).toBe(JSON.stringify({ name: 'test' }));
      });

      it('should pass string body as-is', async () => {
        mockFetchSuccess({ data: 'test' });

        await apiRequest('/api/v1/test', {
          method: 'POST',
          body: 'raw body',
        });

        const { rawBody } = getFetchCallDetails();
        expect(rawBody).toBe('raw body');
      });

      it('should allow custom headers', async () => {
        mockFetchSuccess({ data: 'test' });

        await apiRequest('/api/v1/test', {
          headers: { 'X-Custom-Header': 'value' },
        });

        const { headers } = getFetchCallDetails();
        expect(headers['X-Custom-Header']).toBe('value');
      });

      it('should default to GET method', async () => {
        mockFetchSuccess({ data: 'test' });

        await apiRequest('/api/v1/test');

        assertFetchCalledWith({ method: 'GET' });
      });
    });

    describe('Response handling', () => {
      it('should parse JSON response', async () => {
        mockFetchSuccess({ id: '123', name: 'test' });

        const result = await apiRequest<{ id: string; name: string }>('/api/v1/test');

        expect(result).toEqual({ id: '123', name: 'test' });
      });

      it('should return text for non-JSON response', async () => {
        vi.stubGlobal(
          'fetch',
          vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'text/plain' }),
            text: vi.fn().mockResolvedValue('Plain text response'),
          })
        );

        const result = await apiRequest<string>('/api/v1/test');

        expect(result).toBe('Plain text response');
      });

      it('should return raw response when requested', async () => {
        const mockResponse = {
          ok: true,
          status: 200,
          headers: new Headers(),
        };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

        const result = await apiRequest('/api/v1/test', { rawResponse: true });

        expect(result).toBe(mockResponse);
      });
    });

    describe('Error mapping', () => {
      it('should throw ValidationError for 400', async () => {
        mockFetchErrorResponse(400, 'Invalid input');

        await expect(apiRequest('/api/v1/test')).rejects.toThrow(ValidationError);
      });

      it('should throw AuthenticationError for 401', async () => {
        mockFetchErrorResponse(401, 'Invalid API key');

        await expect(apiRequest('/api/v1/test')).rejects.toThrow(AuthenticationError);
      });

      it('should throw AuthorizationError for 403', async () => {
        mockFetchErrorResponse(403, 'Permission denied');

        await expect(apiRequest('/api/v1/test')).rejects.toThrow(AuthorizationError);
      });

      it('should throw NotFoundError for 404', async () => {
        mockFetchErrorResponse(404, 'Not found');

        await expect(apiRequest('/api/v1/test')).rejects.toThrow(NotFoundError);
      });

      it('should throw RateLimitError for 429', async () => {
        mockFetchErrorResponse(429, 'Too many requests');

        await expect(apiRequest('/api/v1/test')).rejects.toThrow(RateLimitError);
      });

      it('should throw ApiError for other status codes', async () => {
        mockFetchErrorResponse(500, 'Internal server error');

        await expect(apiRequest('/api/v1/test')).rejects.toThrow(ApiError);
      });

      it('should include error context', async () => {
        mockFetchErrorResponse(400, 'Validation failed');

        try {
          await apiRequest('/api/v1/test');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).context.endpoint).toBe('/api/v1/test');
          expect((error as ValidationError).context.statusCode).toBe(400);
        }
      });

      it('should throw NetworkError for fetch failures', async () => {
        mockFetchNetworkError('Connection refused');

        await expect(apiRequest('/api/v1/test')).rejects.toThrow(NetworkError);
      });
    });
  });

  describe('HTTP method shortcuts', () => {
    describe('get', () => {
      it('should make GET request', async () => {
        mockFetchSuccess({ data: 'test' });

        await get('/api/v1/test');

        assertFetchCalledWith({ method: 'GET' });
      });

      it('should pass query parameters', async () => {
        mockFetchSuccess({ data: 'test' });

        await get('/api/v1/test', { limit: 50 });

        const { url } = getFetchCallDetails();
        expect(url).toContain('limit=50');
      });
    });

    describe('post', () => {
      it('should make POST request', async () => {
        mockFetchSuccess({ data: 'test' });

        await post('/api/v1/test', { name: 'test' });

        assertFetchCalledWith({ method: 'POST' });
      });

      it('should include body', async () => {
        mockFetchSuccess({ data: 'test' });

        await post('/api/v1/test', { name: 'test' });

        const { body } = getFetchCallDetails();
        expect(body).toEqual({ name: 'test' });
      });
    });

    describe('put', () => {
      it('should make PUT request', async () => {
        mockFetchSuccess({ data: 'test' });

        await put('/api/v1/test', { name: 'updated' });

        assertFetchCalledWith({ method: 'PUT' });
      });
    });

    describe('patch', () => {
      it('should make PATCH request', async () => {
        mockFetchSuccess({ data: 'test' });

        await patch('/api/v1/test', { name: 'patched' });

        assertFetchCalledWith({ method: 'PATCH' });
      });
    });

    describe('del', () => {
      it('should make DELETE request', async () => {
        mockFetchSuccess({});

        await del('/api/v1/test');

        assertFetchCalledWith({ method: 'DELETE' });
      });
    });
  });

  describe('apiRequestWithRetry', () => {
    it('should succeed on first attempt', async () => {
      mockFetchSuccess({ data: 'test' });

      const result = await apiRequestWithRetry('/api/v1/test');

      expect(result).toEqual({ data: 'test' });
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable error', async () => {
      mockFetchSequence([
        { ok: false, status: 500, data: { message: 'Server error' } },
        { ok: true, status: 200, data: { data: 'success' } },
      ]);

      const result = await apiRequestWithRetry('/api/v1/test', {}, { maxRetries: 3 });

      expect(result).toEqual({ data: 'success' });
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-retryable error', async () => {
      mockFetchErrorResponse(400, 'Bad request');

      await expect(apiRequestWithRetry('/api/v1/test', {}, { maxRetries: 3 })).rejects.toThrow(
        ValidationError
      );

      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
    });

    it('should respect maxRetries limit', async () => {
      mockFetchSequence([
        { ok: false, status: 500, data: { message: 'Error 1' } },
        { ok: false, status: 500, data: { message: 'Error 2' } },
        { ok: false, status: 500, data: { message: 'Error 3' } },
        { ok: false, status: 500, data: { message: 'Error 4' } },
      ]);

      await expect(
        apiRequestWithRetry('/api/v1/test', {}, { maxRetries: 2, retryDelay: 10 })
      ).rejects.toThrow(ApiError);

      // Initial + 2 retries = 3 calls
      expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const startTime = Date.now();
      mockFetchSequence([
        { ok: false, status: 500, data: { message: 'Error 1' } },
        { ok: false, status: 500, data: { message: 'Error 2' } },
        { ok: true, status: 200, data: { data: 'success' } },
      ]);

      await apiRequestWithRetry('/api/v1/test', {}, { maxRetries: 3, retryDelay: 50 });

      const elapsed = Date.now() - startTime;
      // First retry: 50ms, Second retry: 100ms = 150ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });

    it('should retry on network error', async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockRejectedValueOnce(new TypeError('fetch failed'))
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: vi.fn().mockResolvedValue({ data: 'success' }),
          })
      );

      const result = await apiRequestWithRetry(
        '/api/v1/test',
        {},
        { maxRetries: 3, retryDelay: 10 }
      );

      expect(result).toEqual({ data: 'success' });
    });
  });
});
