/**
 * Edge case tests for ZeroDrive MCP Server
 *
 * Tests edge cases around:
 * - Pagination boundaries
 * - Concurrent operations
 * - Large file handling
 * - Input boundary conditions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  resetFetchMock,
  mockFetchOnce,
  mockFetchSequence,
  mockFetchSuccess,
  mockFetchErrorResponse,
} from '../mocks/fetch.mock.js';
import { createMockFile } from '../mocks/entities.mock.js';
import { createPaginatedResponse } from '../mocks/responses.mock.js';
import { fileHandlers } from '../../src/tools/files/handlers.js';
import { folderHandlers } from '../../src/tools/folders/handlers.js';
import { workspaceHandlers } from '../../src/tools/workspaces/handlers.js';
import { parseArgs } from '../../src/schemas/common.js';
import { paginationSchema, fileFiltersSchema } from '../../src/schemas/common.js';
import { QueryBuilder } from '../../src/utils/query-builder.js';

describe('Edge Cases', () => {
  beforeEach(() => {
    resetFetchMock();
    vi.clearAllMocks();
  });

  describe('Pagination Edge Cases', () => {
    describe('empty results', () => {
      it('should handle empty file list', async () => {
        mockFetchSuccess(createPaginatedResponse([]));

        const result = await fileHandlers.list_files({});
        const parsed = JSON.parse(result);

        expect(parsed.data).toHaveLength(0);
        expect(parsed.pagination.total).toBe(0);
      });

      it('should handle empty folder list', async () => {
        mockFetchSuccess(createPaginatedResponse([]));

        const result = await folderHandlers.list_folders({});
        const parsed = JSON.parse(result);

        expect(parsed.data).toHaveLength(0);
      });

      it('should handle empty workspace list', async () => {
        mockFetchSuccess(createPaginatedResponse([]));

        const result = await workspaceHandlers.list_workspaces({});
        const parsed = JSON.parse(result);

        expect(parsed.data).toHaveLength(0);
      });
    });

    describe('pagination limits', () => {
      it('should handle limit=1 (minimum)', async () => {
        const result = parseArgs(paginationSchema, { limit: 1, offset: 0 });
        expect(result.limit).toBe(1);
      });

      it('should handle limit=100 (maximum)', async () => {
        const result = parseArgs(paginationSchema, { limit: 100, offset: 0 });
        expect(result.limit).toBe(100);
      });

      it('should reject limit=0', async () => {
        expect(() => parseArgs(paginationSchema, { limit: 0, offset: 0 })).toThrow();
      });

      it('should reject limit=101 (over maximum)', async () => {
        expect(() => parseArgs(paginationSchema, { limit: 101, offset: 0 })).toThrow();
      });

      it('should handle offset=0 (minimum)', async () => {
        const result = parseArgs(paginationSchema, { limit: 50, offset: 0 });
        expect(result.offset).toBe(0);
      });

      it('should handle very large offset', async () => {
        const result = parseArgs(paginationSchema, { limit: 50, offset: 999999 });
        expect(result.offset).toBe(999999);
      });

      it('should reject negative offset', async () => {
        expect(() => parseArgs(paginationSchema, { limit: 50, offset: -1 })).toThrow();
      });
    });

    describe('exactly 100 items', () => {
      it('should handle exactly 100 files', async () => {
        const files = Array.from({ length: 100 }, (_, i) =>
          createMockFile({ id: `file-${i}`, name: `file-${i}.txt` })
        );

        mockFetchSuccess(createPaginatedResponse(files, { total: 100, limit: 100 }));

        const result = await fileHandlers.list_files({ limit: 100 });
        const parsed = JSON.parse(result);

        expect(parsed.data).toHaveLength(100);
        expect(parsed.pagination.total).toBe(100);
      });

      it('should indicate hasMore when more items exist', async () => {
        const files = Array.from({ length: 100 }, (_, i) =>
          createMockFile({ id: `file-${i}`, name: `file-${i}.txt` })
        );

        mockFetchSuccess(createPaginatedResponse(files, { total: 150, limit: 100, hasMore: true }));

        const result = await fileHandlers.list_files({ limit: 100 });
        const parsed = JSON.parse(result);

        expect(parsed.data).toHaveLength(100);
        expect(parsed.pagination.hasMore).toBe(true);
        expect(parsed.pagination.total).toBe(150);
      });
    });

    describe('offset beyond total', () => {
      it('should return empty when offset exceeds total', async () => {
        mockFetchSuccess(createPaginatedResponse([], { total: 50, limit: 50, offset: 999999 }));

        const result = await fileHandlers.list_files({ limit: 50, offset: 999999 });
        const parsed = JSON.parse(result);

        expect(parsed.data).toHaveLength(0);
        expect(parsed.pagination.offset).toBe(999999);
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle 5 parallel list operations', async () => {
      // Mock responses for all 5 calls
      const responses = Array.from({ length: 5 }, (_, i) => ({
        ok: true,
        status: 200,
        data: createPaginatedResponse([createMockFile({ id: `file-${i}`, name: `file-${i}.txt` })]),
      }));

      mockFetchSequence(responses);

      // Execute 5 parallel list operations
      const operations = Array.from({ length: 5 }, () => fileHandlers.list_files({}));
      const results = await Promise.all(operations);

      // All should succeed and return valid JSON
      for (const result of results) {
        const parsed = JSON.parse(result);
        expect(parsed).toHaveProperty('data');
        expect(parsed).toHaveProperty('pagination');
      }
    });

    it('should handle 10 parallel list operations', async () => {
      const responses = Array.from({ length: 10 }, () => ({
        ok: true,
        status: 200,
        data: createPaginatedResponse([]),
      }));

      mockFetchSequence(responses);

      const operations = Array.from({ length: 10 }, () => folderHandlers.list_folders({}));
      const results = await Promise.all(operations);

      for (const result of results) {
        const parsed = JSON.parse(result);
        expect(parsed).toHaveProperty('data');
      }
    });

    it('should handle mixed parallel operations', async () => {
      mockFetchSequence([
        { ok: true, status: 200, data: createPaginatedResponse([]) },
        { ok: true, status: 200, data: createPaginatedResponse([]) },
        { ok: true, status: 200, data: createPaginatedResponse([]) },
      ]);

      const results = await Promise.all([
        fileHandlers.list_files({}),
        folderHandlers.list_folders({}),
        workspaceHandlers.list_workspaces({}),
      ]);

      for (const result of results) {
        const parsed = JSON.parse(result);
        expect(parsed).toHaveProperty('data');
      }
    });

    it('should handle partial failures in parallel operations', async () => {
      mockFetchSequence([
        { ok: true, status: 200, data: createPaginatedResponse([]) },
        { ok: false, status: 500, data: { error: 'Internal server error' } },
        { ok: true, status: 200, data: createPaginatedResponse([]) },
      ]);

      const results = await Promise.allSettled([
        fileHandlers.list_files({}),
        folderHandlers.list_folders({}),
        workspaceHandlers.list_workspaces({}),
      ]);

      // First and third should succeed, second should fail
      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');
    });
  });

  describe('Large File Handling', () => {
    it('should handle file size display for 99MB file', async () => {
      const file = createMockFile({
        id: 'large-file-99',
        name: 'large-99mb.bin',
        size: 99 * 1024 * 1024, // 99MB
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].size).toBe(99 * 1024 * 1024);
    });

    it('should handle file size display for 100MB file', async () => {
      const file = createMockFile({
        id: 'large-file-100',
        name: 'large-100mb.bin',
        size: 100 * 1024 * 1024, // 100MB
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].size).toBe(100 * 1024 * 1024);
    });

    it('should handle file size display for 1GB file', async () => {
      const file = createMockFile({
        id: 'large-file-1gb',
        name: 'large-1gb.bin',
        size: 1024 * 1024 * 1024, // 1GB
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].size).toBe(1024 * 1024 * 1024);
    });

    it('should handle 0 byte file', async () => {
      const file = createMockFile({
        id: 'empty-file',
        name: 'empty.txt',
        size: 0,
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].size).toBe(0);
    });
  });

  describe('Input Boundary Conditions', () => {
    describe('string inputs', () => {
      it('should handle empty search string', async () => {
        const result = parseArgs(fileFiltersSchema, { search: '' });
        expect(result.search).toBe('');
      });

      it('should handle very long search string', async () => {
        const longSearch = 'a'.repeat(1000);
        const result = parseArgs(fileFiltersSchema, { search: longSearch });
        expect(result.search).toBe(longSearch);
      });

      it('should handle special characters in search', async () => {
        const specialSearch = '!@#$%^&*()_+-=[]{}|;:\'"<>,.?/\\';
        const result = parseArgs(fileFiltersSchema, { search: specialSearch });
        expect(result.search).toBe(specialSearch);
      });

      it('should handle unicode in search', async () => {
        const unicodeSearch = '日本語テスト emoji: 🎉';
        const result = parseArgs(fileFiltersSchema, { search: unicodeSearch });
        expect(result.search).toBe(unicodeSearch);
      });
    });

    describe('boolean values', () => {
      it('should accept boolean true', async () => {
        const result = parseArgs(fileFiltersSchema, { starred: true });
        expect(result.starred).toBe(true);
      });

      it('should accept boolean false', async () => {
        const result = parseArgs(fileFiltersSchema, { starred: false });
        expect(result.starred).toBe(false);
      });
    });

    describe('number values', () => {
      it('should accept numeric limit', async () => {
        const result = parseArgs(paginationSchema, { limit: 50, offset: 0 });
        expect(result.limit).toBe(50);
        expect(result.offset).toBe(0);
      });

      it('should reject float values for integers', async () => {
        // Zod requires integers for pagination
        expect(() => parseArgs(paginationSchema, { limit: 50.7, offset: 0 })).toThrow();
      });
    });
  });

  describe('Query Builder Edge Cases', () => {
    it('should handle empty query builder', () => {
      const builder = new QueryBuilder();
      expect(builder.build()).toBe('');
      expect(builder.hasParams()).toBe(false);
    });

    it('should handle query with only undefined values', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('key1', undefined);
      builder.appendIfDefined('key2', undefined);
      expect(builder.build()).toBe('');
    });

    it('should handle very long query string', () => {
      const builder = new QueryBuilder();
      for (let i = 0; i < 100; i++) {
        builder.appendIfDefined(`key${i}`, `value${i}`);
      }
      const query = builder.build();
      expect(query).toContain('key0=value0');
      expect(query).toContain('key99=value99');
    });

    it('should URL encode special characters', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('search', 'hello world & test=value');
      const query = builder.build();
      // URLSearchParams uses + for spaces
      expect(query).toContain('search=hello+world+%26+test%3Dvalue');
    });

    it('should handle boolean false explicitly', () => {
      const builder = new QueryBuilder();
      builder.appendBoolean('flag', false);
      // build() returns params without ? prefix
      expect(builder.build()).toBe('flag=false');
    });

    it('should build with prefix for non-empty params', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('key', 'value');
      // buildWithPrefix adds ? prefix
      expect(builder.buildWithPrefix()).toBe('?key=value');
    });

    it('should return empty string for buildWithPrefix when no params', () => {
      const builder = new QueryBuilder();
      expect(builder.buildWithPrefix()).toBe('');
    });
  });

  describe('API Response Edge Cases', () => {
    it('should handle response with extra unknown fields', async () => {
      mockFetchOnce({
        json: {
          data: [
            {
              ...createMockFile({ id: 'file-1' }),
              unknownField: 'should be ignored',
              anotherUnknown: { nested: true },
            },
          ],
          pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
          extraField: 'ignored',
        },
      });

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].id).toBe('file-1');
    });

    it('should handle null values in optional fields', async () => {
      const file = createMockFile({
        id: 'file-null',
        name: 'null-test.txt',
        folderId: null,
        description: null,
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].id).toBe('file-null');
    });

    it('should handle empty string values', async () => {
      const file = createMockFile({
        id: 'file-empty',
        name: 'empty-test.txt',
        description: '',
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].id).toBe('file-empty');
    });
  });

  describe('Date Handling Edge Cases', () => {
    it('should handle very old dates', async () => {
      const file = createMockFile({
        id: 'old-file',
        name: 'old.txt',
        createdAt: '1970-01-01T00:00:00.000Z',
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].createdAt).toBe('1970-01-01T00:00:00.000Z');
    });

    it('should handle future dates', async () => {
      const file = createMockFile({
        id: 'future-file',
        name: 'future.txt',
        createdAt: '2099-12-31T23:59:59.999Z',
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].createdAt).toBe('2099-12-31T23:59:59.999Z');
    });
  });

  describe('ID Edge Cases', () => {
    it('should handle UUID format IDs', async () => {
      const file = createMockFile({
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'uuid-file.txt',
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].id).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should handle short IDs', async () => {
      const file = createMockFile({
        id: 'a',
        name: 'short-id.txt',
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].id).toBe('a');
    });

    it('should handle very long IDs', async () => {
      const longId = 'a'.repeat(100);
      const file = createMockFile({
        id: longId,
        name: 'long-id.txt',
      });

      mockFetchSuccess(createPaginatedResponse([file]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data[0].id).toBe(longId);
    });
  });

  describe('Error Handling Edge Cases', () => {
    it('should handle 404 errors', async () => {
      mockFetchErrorResponse(404, 'File not found');

      await expect(fileHandlers.get_file({ fileId: 'nonexistent' })).rejects.toThrow();
    });

    it('should handle 401 errors', async () => {
      mockFetchErrorResponse(401, 'Invalid API key');

      await expect(fileHandlers.list_files({})).rejects.toThrow();
    });

    it('should handle 500 errors', async () => {
      mockFetchErrorResponse(500, 'Internal server error');

      await expect(fileHandlers.list_files({})).rejects.toThrow();
    });

    it('should handle rate limit errors', async () => {
      mockFetchErrorResponse(429, 'Too many requests');

      await expect(fileHandlers.list_files({})).rejects.toThrow();
    });
  });
});
