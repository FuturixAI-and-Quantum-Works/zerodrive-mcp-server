/**
 * Unit tests for trash tool handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZodError } from 'zod';
import { trashHandlers, executeTrashTool } from '../../../../src/tools/trash/handlers.js';
import {
  mockFetchSuccess,
  mockFetchErrorResponse,
  assertFetchCalledWith,
  getFetchCallDetails,
} from '../../../mocks/fetch.mock.js';
import { createMockTrashItem, createMockTrashItems } from '../../../mocks/entities.mock.js';
import { createPaginatedResponse } from '../../../mocks/responses.mock.js';
import {
  trashFixtures,
  trashListFixtures,
  restoreResultFixtures,
  emptyTrashResultFixtures,
} from '../../../fixtures/data/trash.fixture.js';

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

describe('Trash Tool Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list_trash', () => {
    it('should list trash items with default pagination', async () => {
      const items = createMockTrashItems(5);
      mockFetchSuccess(createPaginatedResponse(items));

      const result = await trashHandlers.list_trash({});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(5);
      expect(parsed.pagination).toBeDefined();
      assertFetchCalledWith({
        url: '/api/v1/trash',
        method: 'GET',
      });
    });

    it('should apply pagination parameters', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await trashHandlers.list_trash({ limit: 25, offset: 50 });

      const { url } = getFetchCallDetails();
      expect(url).toContain('limit=25');
      expect(url).toContain('offset=50');
    });

    it('should apply sort by trashedAt', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await trashHandlers.list_trash({ sortBy: 'trashedAt', sortOrder: 'desc' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('sortBy=trashedAt');
      expect(url).toContain('sortOrder=desc');
    });

    it('should apply sort by name', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await trashHandlers.list_trash({ sortBy: 'name', sortOrder: 'asc' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('sortBy=name');
      expect(url).toContain('sortOrder=asc');
    });

    it('should apply sort by size', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await trashHandlers.list_trash({ sortBy: 'size', sortOrder: 'desc' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('sortBy=size');
      expect(url).toContain('sortOrder=desc');
    });

    it('should apply sort by updatedAt', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await trashHandlers.list_trash({ sortBy: 'updatedAt', sortOrder: 'asc' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('sortBy=updatedAt');
    });

    it('should apply sort by createdAt', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await trashHandlers.list_trash({ sortBy: 'createdAt', sortOrder: 'asc' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('sortBy=createdAt');
    });

    it('should handle empty trash', async () => {
      mockFetchSuccess(trashListFixtures.empty);

      const result = await trashHandlers.list_trash({});
      const parsed = JSON.parse(result);

      expect(parsed.data).toEqual([]);
      expect(parsed.pagination.total).toBe(0);
    });

    it('should handle max limit (100)', async () => {
      const items = createMockTrashItems(100);
      mockFetchSuccess(createPaginatedResponse(items, { total: 250, limit: 100, hasMore: true }));

      const result = await trashHandlers.list_trash({ limit: 100 });
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(100);
      expect(parsed.pagination.hasMore).toBe(true);
    });

    it('should handle files only in trash', async () => {
      mockFetchSuccess(trashListFixtures.filesOnly);

      const result = await trashHandlers.list_trash({});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(4);
      parsed.data.forEach((item: { type: string }) => {
        expect(item.type).toBe('file');
      });
    });

    it('should handle folders only in trash', async () => {
      mockFetchSuccess(trashListFixtures.foldersOnly);

      const result = await trashHandlers.list_trash({});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(2);
      parsed.data.forEach((item: { type: string }) => {
        expect(item.type).toBe('folder');
      });
    });

    it('should handle mixed files and folders', async () => {
      mockFetchSuccess(trashListFixtures.mixed);

      const result = await trashHandlers.list_trash({});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(3);
      const types = parsed.data.map((item: { type: string }) => item.type);
      expect(types).toContain('file');
      expect(types).toContain('folder');
    });

    it('should reject limit above max', async () => {
      await expect(trashHandlers.list_trash({ limit: 200 })).rejects.toThrow();
    });

    it('should reject negative offset', async () => {
      await expect(trashHandlers.list_trash({ offset: -1 })).rejects.toThrow();
    });

    it('should reject invalid sortBy', async () => {
      await expect(trashHandlers.list_trash({ sortBy: 'invalid' as 'name' })).rejects.toThrow();
    });
  });

  describe('restore_from_trash', () => {
    it('should restore file from trash', async () => {
      mockFetchSuccess(restoreResultFixtures.file);

      const result = await trashHandlers.restore_from_trash({ itemId: 'trash-file-001' });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('trash-file-001');
      expect(parsed.type).toBe('file');
      expect(parsed.restoredTo).toBe('folder-documents-001');
      assertFetchCalledWith({
        url: '/api/v1/trash/trash-file-001/restore',
        method: 'POST',
      });
    });

    it('should restore folder from trash', async () => {
      mockFetchSuccess(restoreResultFixtures.folder);

      const result = await trashHandlers.restore_from_trash({ itemId: 'trash-folder-001' });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('trash-folder-001');
      expect(parsed.type).toBe('folder');
      expect(parsed.restoredTo).toBeNull();
    });

    it('should restore file to root', async () => {
      mockFetchSuccess(restoreResultFixtures.fileToRoot);

      const result = await trashHandlers.restore_from_trash({ itemId: 'trash-file-002' });
      const parsed = JSON.parse(result);

      expect(parsed.restoredTo).toBeNull();
    });

    it('should apply type=file hint', async () => {
      mockFetchSuccess(restoreResultFixtures.file);

      await trashHandlers.restore_from_trash({ itemId: 'trash-file-001', type: 'file' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('type=file');
    });

    it('should apply type=folder hint', async () => {
      mockFetchSuccess(restoreResultFixtures.folder);

      await trashHandlers.restore_from_trash({ itemId: 'trash-folder-001', type: 'folder' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('type=folder');
    });

    it('should auto-detect type when not specified', async () => {
      mockFetchSuccess(restoreResultFixtures.file);

      await trashHandlers.restore_from_trash({ itemId: 'trash-item-001' });

      const { url } = getFetchCallDetails();
      expect(url).not.toContain('type=');
    });

    it('should throw on missing itemId', async () => {
      await expectToThrowZodError(() => trashHandlers.restore_from_trash({}), 'Required');
    });

    it('should throw on empty itemId', async () => {
      await expectToThrowZodError(
        () => trashHandlers.restore_from_trash({ itemId: '' }),
        'ID is required'
      );
    });

    it('should throw on invalid type', async () => {
      await expect(
        trashHandlers.restore_from_trash({
          itemId: 'trash-001',
          type: 'invalid' as 'file' | 'folder',
        })
      ).rejects.toThrow(ZodError);
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'Item not found in trash');

      await expect(trashHandlers.restore_from_trash({ itemId: 'nonexistent' })).rejects.toThrow();
    });

    it('should handle 409 conflict (original location deleted)', async () => {
      mockFetchErrorResponse(409, 'Original parent folder no longer exists');

      await expect(trashHandlers.restore_from_trash({ itemId: 'trash-001' })).rejects.toThrow();
    });
  });

  describe('empty_trash', () => {
    it('should empty trash successfully', async () => {
      mockFetchSuccess(emptyTrashResultFixtures.success);

      const result = await trashHandlers.empty_trash({});
      const parsed = JSON.parse(result);

      expect(parsed.deletedCount).toBe(10);
      expect(parsed.message).toBe('Trash emptied successfully');
      assertFetchCalledWith({
        url: '/api/v1/trash',
        method: 'DELETE',
      });
    });

    it('should handle already empty trash', async () => {
      mockFetchSuccess(emptyTrashResultFixtures.empty);

      const result = await trashHandlers.empty_trash({});
      const parsed = JSON.parse(result);

      expect(parsed.deletedCount).toBe(0);
      expect(parsed.message).toBe('Trash was already empty');
    });

    it('should handle partial empty (with errors)', async () => {
      mockFetchSuccess(emptyTrashResultFixtures.partial);

      const result = await trashHandlers.empty_trash({});
      const parsed = JSON.parse(result);

      expect(parsed.deletedCount).toBe(5);
      expect(parsed.errors).toBeDefined();
      expect(parsed.errors).toHaveLength(2);
    });

    it('should accept empty object as argument', async () => {
      mockFetchSuccess(emptyTrashResultFixtures.success);

      await expect(trashHandlers.empty_trash({})).resolves.not.toThrow();
    });

    it('should ignore unknown arguments', async () => {
      mockFetchSuccess(emptyTrashResultFixtures.success);

      await expect(trashHandlers.empty_trash({ unknownArg: 'value' })).resolves.not.toThrow();
    });
  });

  describe('executeTrashTool', () => {
    it('should route to list_trash', async () => {
      const items = createMockTrashItems(3);
      mockFetchSuccess(createPaginatedResponse(items));

      const result = await executeTrashTool('list_trash', {});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(3);
    });

    it('should route to restore_from_trash', async () => {
      mockFetchSuccess(restoreResultFixtures.file);

      const result = await executeTrashTool('restore_from_trash', { itemId: 'trash-file-001' });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('trash-file-001');
    });

    it('should route to empty_trash', async () => {
      mockFetchSuccess(emptyTrashResultFixtures.success);

      const result = await executeTrashTool('empty_trash', {});
      const parsed = JSON.parse(result);

      expect(parsed.deletedCount).toBe(10);
    });

    it('should handle list_trash with filters', async () => {
      mockFetchSuccess(createPaginatedResponse(createMockTrashItems(2)));

      const result = await executeTrashTool('list_trash', {
        limit: 10,
        sortBy: 'trashedAt',
        sortOrder: 'desc',
      });
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(2);
    });

    it('should handle restore_from_trash with type hint', async () => {
      mockFetchSuccess(restoreResultFixtures.folder);

      const result = await executeTrashTool('restore_from_trash', {
        itemId: 'trash-folder-001',
        type: 'folder',
      });
      const parsed = JSON.parse(result);

      expect(parsed.type).toBe('folder');
    });
  });
});
