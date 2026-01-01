/**
 * Unit tests for file tool handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZodError } from 'zod';
import { fileHandlers, executeFileTool } from '../../../../src/tools/files/handlers.js';
import {
  mockFetchOnce,
  mockFetchSuccess,
  mockFetchErrorResponse,
  assertFetchCalledWith,
  getFetchCallDetails,
} from '../../../mocks/fetch.mock.js';
import { createMockFile, createMockFiles } from '../../../mocks/entities.mock.js';
import { mockApiResponses, createPaginatedResponse } from '../../../mocks/responses.mock.js';
import { fileFixtures, createFileList } from '../../../fixtures/data/files.fixture.js';

/**
 * Helper to check if ZodError contains a specific message
 */
function expectZodError(error: unknown, expectedMessage: string): void {
  expect(error).toBeInstanceOf(ZodError);
  const zodError = error as ZodError;
  const hasMessage = zodError.issues.some((issue) =>
    issue.message.toLowerCase().includes(expectedMessage.toLowerCase())
  );
  expect(hasMessage).toBe(true);
}

/**
 * Helper to assert that an async function throws a ZodError with specific message
 */
async function expectToThrowZodError(
  fn: () => Promise<unknown>,
  expectedMessage: string
): Promise<void> {
  try {
    await fn();
    expect.fail('Expected function to throw');
  } catch (error) {
    expectZodError(error, expectedMessage);
  }
}

describe('File Tool Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list_files', () => {
    it('should list files with default pagination', async () => {
      const files = createMockFiles(5);
      mockFetchSuccess(createPaginatedResponse(files));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(5);
      expect(parsed.pagination).toBeDefined();
      assertFetchCalledWith({
        url: '/api/v1/files',
        method: 'GET',
      });
    });

    it('should apply folderId filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({ folderId: 'folder-123' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('folderId=folder-123');
    });

    it('should apply null folderId for root (omits from query)', async () => {
      // Note: null folderId is converted to undefined by QueryBuilder
      // and omitted from the query string - this is expected behavior
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({ folderId: null });

      const { url } = getFetchCallDetails();
      // null folderId should NOT appear in URL (converted to undefined and omitted)
      expect(url).not.toContain('folderId');
    });

    it('should apply includeSubfolders filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({ includeSubfolders: true });

      const { url } = getFetchCallDetails();
      expect(url).toContain('includeSubfolders=true');
    });

    it('should apply starred filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({ starred: true });

      const { url } = getFetchCallDetails();
      expect(url).toContain('starred=true');
    });

    it('should apply shared filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({ shared: true });

      const { url } = getFetchCallDetails();
      expect(url).toContain('shared=true');
    });

    it('should apply trashed filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({ trashed: false });

      const { url } = getFetchCallDetails();
      expect(url).toContain('trashed=false');
    });

    it('should apply search filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({ search: 'report' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('search=report');
    });

    it('should apply pagination parameters', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({ limit: 25, offset: 50 });

      const { url } = getFetchCallDetails();
      expect(url).toContain('limit=25');
      expect(url).toContain('offset=50');
    });

    it('should apply sort parameters', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({ sortBy: 'size', sortOrder: 'desc' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('sortBy=size');
      expect(url).toContain('sortOrder=desc');
    });

    it('should apply multiple filters', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await fileHandlers.list_files({
        folderId: 'folder-1',
        starred: true,
        shared: false,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'asc',
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('folderId=folder-1');
      expect(url).toContain('starred=true');
      expect(url).toContain('shared=false');
      expect(url).toContain('limit=10');
      expect(url).toContain('sortBy=name');
    });

    it('should handle empty results', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      const result = await fileHandlers.list_files({});
      const parsed = JSON.parse(result);

      expect(parsed.data).toEqual([]);
      expect(parsed.pagination.total).toBe(0);
    });

    it('should handle max limit (100)', async () => {
      const files = createMockFiles(100);
      mockFetchSuccess(createPaginatedResponse(files, { total: 250, limit: 100, hasMore: true }));

      const result = await fileHandlers.list_files({ limit: 100 });
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(100);
      expect(parsed.pagination.hasMore).toBe(true);
    });

    it('should handle offset beyond total', async () => {
      mockFetchSuccess(createPaginatedResponse([], { total: 50, offset: 100, hasMore: false }));

      const result = await fileHandlers.list_files({ offset: 100 });
      const parsed = JSON.parse(result);

      expect(parsed.data).toEqual([]);
    });

    it('should reject limit above max', async () => {
      await expect(fileHandlers.list_files({ limit: 200 })).rejects.toThrow();
    });

    it('should reject negative offset', async () => {
      await expect(fileHandlers.list_files({ offset: -1 })).rejects.toThrow();
    });

    it('should reject invalid sortBy', async () => {
      await expect(
        fileHandlers.list_files({ sortBy: 'invalid' as unknown as 'name' })
      ).rejects.toThrow();
    });
  });

  describe('get_file', () => {
    it('should get file by ID', async () => {
      const file = createMockFile({ id: 'file-123', name: 'test.pdf' });
      mockFetchSuccess(file);

      const result = await fileHandlers.get_file({ fileId: 'file-123' });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('file-123');
      expect(parsed.name).toBe('test.pdf');
      assertFetchCalledWith({
        url: '/api/v1/files/file-123',
        method: 'GET',
      });
    });

    it('should throw on missing fileId', async () => {
      await expectToThrowZodError(() => fileHandlers.get_file({}), 'Required');
    });

    it('should throw on empty fileId', async () => {
      await expectToThrowZodError(() => fileHandlers.get_file({ fileId: '' }), 'ID is required');
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'File not found');

      await expect(fileHandlers.get_file({ fileId: 'nonexistent' })).rejects.toThrow();
    });

    it('should return file with all properties', async () => {
      mockFetchSuccess(fileFixtures.starred);

      const result = await fileHandlers.get_file({ fileId: 'file-starred-001' });
      const parsed = JSON.parse(result);

      expect(parsed.isStarred).toBe(true);
      expect(parsed.mimeType).toBeDefined();
      expect(parsed.size).toBeDefined();
    });
  });

  describe('download_file', () => {
    it('should get download URL', async () => {
      mockFetchSuccess(mockApiResponses.downloadUrl('file-123'));

      const result = await fileHandlers.download_file({ fileId: 'file-123' });
      const parsed = JSON.parse(result);

      expect(parsed.url).toContain('download');
      expect(parsed.expiresAt).toBeDefined();
      assertFetchCalledWith({
        url: '/api/v1/files/file-123/download',
        method: 'GET',
      });
    });

    it('should throw on missing fileId', async () => {
      await expectToThrowZodError(() => fileHandlers.download_file({}), 'Required');
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'File not found');

      await expect(fileHandlers.download_file({ fileId: 'nonexistent' })).rejects.toThrow();
    });
  });

  describe('generate_signed_url', () => {
    it('should generate signed URL with default expiry', async () => {
      mockFetchSuccess(mockApiResponses.signedUrl('file-123'));

      const result = await fileHandlers.generate_signed_url({ fileId: 'file-123' });
      const parsed = JSON.parse(result);

      expect(parsed.url).toContain('signed');
      expect(parsed.expiresAt).toBeDefined();
      assertFetchCalledWith({
        url: '/api/v1/files/file-123/signed-url',
        method: 'GET',
      });
    });

    it('should generate signed URL with custom expiry', async () => {
      mockFetchSuccess(mockApiResponses.signedUrl('file-123', 24));

      await fileHandlers.generate_signed_url({ fileId: 'file-123', expires: 86400 });

      const { url } = getFetchCallDetails();
      expect(url).toContain('expires=86400');
    });

    it('should use default expiry (3600) when not specified', async () => {
      mockFetchSuccess(mockApiResponses.signedUrl('file-123'));

      await fileHandlers.generate_signed_url({ fileId: 'file-123' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('expires=3600');
    });

    it('should reject expiry below minimum (3600)', async () => {
      await expectToThrowZodError(
        () => fileHandlers.generate_signed_url({ fileId: 'file-123', expires: 1000 }),
        'Minimum expiry'
      );
    });

    it('should reject expiry above maximum (604800)', async () => {
      await expectToThrowZodError(
        () => fileHandlers.generate_signed_url({ fileId: 'file-123', expires: 1000000 }),
        'Maximum expiry'
      );
    });

    it('should accept expiry at minimum boundary', async () => {
      mockFetchSuccess(mockApiResponses.signedUrl('file-123'));

      await fileHandlers.generate_signed_url({ fileId: 'file-123', expires: 3600 });

      const { url } = getFetchCallDetails();
      expect(url).toContain('expires=3600');
    });

    it('should accept expiry at maximum boundary', async () => {
      mockFetchSuccess(mockApiResponses.signedUrl('file-123', 168));

      await fileHandlers.generate_signed_url({ fileId: 'file-123', expires: 604800 });

      const { url } = getFetchCallDetails();
      expect(url).toContain('expires=604800');
    });
  });

  describe('fetch_file_content', () => {
    it('should fetch text file content', async () => {
      mockFetchOnce({ status: 200, text: 'Hello, world!' });

      const result = await fileHandlers.fetch_file_content({ fileId: 'file-123' });

      expect(result).toBe('Hello, world!');
      assertFetchCalledWith({
        url: '/api/v1/files/file-123/fetch',
        method: 'GET',
      });
    });

    it('should fetch with download flag', async () => {
      mockFetchOnce({ status: 200, text: 'File content' });

      await fileHandlers.fetch_file_content({ fileId: 'file-123', download: true });

      const { url } = getFetchCallDetails();
      expect(url).toContain('download=true');
    });

    it('should use default download=false', async () => {
      mockFetchOnce({ status: 200, text: 'Content' });

      await fileHandlers.fetch_file_content({ fileId: 'file-123' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('download=false');
    });

    it('should handle JSON response', async () => {
      mockFetchSuccess({ content: 'JSON content', type: 'application/json' });

      const result = await fileHandlers.fetch_file_content({ fileId: 'file-123' });
      const parsed = JSON.parse(result);

      expect(parsed.content).toBe('JSON content');
    });

    it('should handle large text content', async () => {
      const largeContent = 'x'.repeat(10000);
      mockFetchOnce({ status: 200, text: largeContent });

      const result = await fileHandlers.fetch_file_content({ fileId: 'file-123' });

      expect(result).toBe(largeContent);
    });
  });

  describe('move_file', () => {
    it('should move file to folder', async () => {
      const movedFile = createMockFile({ id: 'file-123', folderId: 'folder-456' });
      mockFetchSuccess(movedFile);

      const result = await fileHandlers.move_file({
        fileId: 'file-123',
        folderId: 'folder-456',
      });
      const parsed = JSON.parse(result);

      expect(parsed.folderId).toBe('folder-456');
      assertFetchCalledWith({
        url: '/api/v1/files/file-123/move',
        method: 'PUT',
      });
    });

    it('should move file to root (null folderId)', async () => {
      const movedFile = createMockFile({ id: 'file-123', folderId: null });
      mockFetchSuccess(movedFile);

      const result = await fileHandlers.move_file({
        fileId: 'file-123',
        folderId: null,
      });
      const parsed = JSON.parse(result);

      expect(parsed.folderId).toBeNull();
    });

    it('should move file to root (undefined folderId)', async () => {
      const movedFile = createMockFile({ id: 'file-123', folderId: null });
      mockFetchSuccess(movedFile);

      await fileHandlers.move_file({ fileId: 'file-123' });

      const { body } = getFetchCallDetails();
      expect(body).toHaveProperty('folderId');
    });

    it('should throw on missing fileId', async () => {
      await expectToThrowZodError(
        () => fileHandlers.move_file({ folderId: 'folder-123' }),
        'Required'
      );
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'File not found');

      await expect(
        fileHandlers.move_file({ fileId: 'nonexistent', folderId: 'folder-123' })
      ).rejects.toThrow();
    });

    it('should handle 404 folder not found', async () => {
      mockFetchErrorResponse(404, 'Folder not found');

      await expect(
        fileHandlers.move_file({ fileId: 'file-123', folderId: 'nonexistent' })
      ).rejects.toThrow();
    });
  });

  describe('share_file', () => {
    it('should share file with single email', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      const result = await fileHandlers.share_file({
        fileId: 'file-123',
        emails: ['user@example.com'],
      });
      const parsed = JSON.parse(result);

      expect(parsed.sharedWith).toContain('user@example.com');
      assertFetchCalledWith({
        url: '/api/v1/files/file-123/share',
        method: 'POST',
      });
    });

    it('should share file with multiple emails', async () => {
      const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      mockFetchSuccess(mockApiResponses.shareSuccess(emails));

      const result = await fileHandlers.share_file({
        fileId: 'file-123',
        emails,
      });
      const parsed = JSON.parse(result);

      expect(parsed.sharedWith).toHaveLength(3);
    });

    it('should apply default role (viewer)', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      await fileHandlers.share_file({
        fileId: 'file-123',
        emails: ['user@example.com'],
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ role: 'viewer' });
    });

    it('should apply editor role', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      await fileHandlers.share_file({
        fileId: 'file-123',
        emails: ['user@example.com'],
        role: 'editor',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ role: 'editor' });
    });

    it('should apply canShare option', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      await fileHandlers.share_file({
        fileId: 'file-123',
        emails: ['user@example.com'],
        canShare: true,
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ canShare: true });
    });

    it('should apply message option', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      await fileHandlers.share_file({
        fileId: 'file-123',
        emails: ['user@example.com'],
        message: 'Please review this document',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ message: 'Please review this document' });
    });

    it('should throw on missing fileId', async () => {
      await expectToThrowZodError(
        () => fileHandlers.share_file({ emails: ['user@example.com'] }),
        'Required'
      );
    });

    it('should throw on missing emails', async () => {
      await expect(fileHandlers.share_file({ fileId: 'file-123' })).rejects.toThrow(ZodError);
    });

    it('should throw on empty emails array', async () => {
      await expectToThrowZodError(
        () => fileHandlers.share_file({ fileId: 'file-123', emails: [] }),
        'At least one email'
      );
    });

    it('should throw on invalid email format', async () => {
      await expectToThrowZodError(
        () =>
          fileHandlers.share_file({
            fileId: 'file-123',
            emails: ['invalid-email'],
          }),
        'Invalid email'
      );
    });

    it('should throw on invalid role', async () => {
      await expect(
        fileHandlers.share_file({
          fileId: 'file-123',
          emails: ['user@example.com'],
          role: 'admin' as unknown as 'viewer' | 'editor',
        })
      ).rejects.toThrow(ZodError);
    });
  });

  describe('upload_file', () => {
    it('should throw on missing filePath', async () => {
      await expectToThrowZodError(() => fileHandlers.upload_file({}), 'Required');
    });

    it('should throw on empty filePath', async () => {
      await expectToThrowZodError(
        () => fileHandlers.upload_file({ filePath: '' }),
        'File path is required'
      );
    });

    // Note: Full upload tests require mocking file system operations
    // These are better suited for integration tests
  });

  describe('executeFileTool', () => {
    it('should route to correct handler', async () => {
      const files = createMockFiles(3);
      mockFetchSuccess(createPaginatedResponse(files));

      const result = await executeFileTool('list_files', {});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(3);
    });

    it('should execute get_file', async () => {
      mockFetchSuccess(createMockFile({ id: 'file-test' }));

      const result = await executeFileTool('get_file', { fileId: 'file-test' });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('file-test');
    });

    it('should execute download_file', async () => {
      mockFetchSuccess(mockApiResponses.downloadUrl('file-test'));

      const result = await executeFileTool('download_file', { fileId: 'file-test' });
      const parsed = JSON.parse(result);

      expect(parsed.url).toBeDefined();
    });

    it('should execute generate_signed_url', async () => {
      mockFetchSuccess(mockApiResponses.signedUrl('file-test'));

      const result = await executeFileTool('generate_signed_url', {
        fileId: 'file-test',
      });
      const parsed = JSON.parse(result);

      expect(parsed.url).toBeDefined();
    });

    it('should execute fetch_file_content', async () => {
      mockFetchOnce({ status: 200, text: 'Content' });

      const result = await executeFileTool('fetch_file_content', {
        fileId: 'file-test',
      });

      expect(result).toBe('Content');
    });

    it('should execute move_file', async () => {
      mockFetchSuccess(createMockFile({ id: 'file-test', folderId: 'folder-new' }));

      const result = await executeFileTool('move_file', {
        fileId: 'file-test',
        folderId: 'folder-new',
      });
      const parsed = JSON.parse(result);

      expect(parsed.folderId).toBe('folder-new');
    });

    it('should execute share_file', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      const result = await executeFileTool('share_file', {
        fileId: 'file-test',
        emails: ['user@example.com'],
      });
      const parsed = JSON.parse(result);

      expect(parsed.sharedWith).toContain('user@example.com');
    });
  });
});
