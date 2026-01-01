/**
 * Unit tests for folder tool handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZodError } from 'zod';
import { folderHandlers, executeFolderTool } from '../../../../src/tools/folders/handlers.js';
import {
  mockFetchSuccess,
  mockFetchErrorResponse,
  assertFetchCalledWith,
  getFetchCallDetails,
} from '../../../mocks/fetch.mock.js';
import { createMockFolder, createMockFolders } from '../../../mocks/entities.mock.js';
import { mockApiResponses, createPaginatedResponse } from '../../../mocks/responses.mock.js';
import { folderFixtures, folderWithPathFixtures } from '../../../fixtures/data/folders.fixture.js';

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

describe('Folder Tool Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list_folders', () => {
    it('should list folders with default pagination', async () => {
      const folders = createMockFolders(5);
      mockFetchSuccess(createPaginatedResponse(folders));

      const result = await folderHandlers.list_folders({});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(5);
      expect(parsed.pagination).toBeDefined();
      assertFetchCalledWith({
        url: '/api/v1/folders',
        method: 'GET',
      });
    });

    it('should apply folderId filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await folderHandlers.list_folders({ folderId: 'folder-123' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('folderId=folder-123');
    });

    it('should apply folderId filter for parent folder', async () => {
      // Note: folderFiltersSchema uses folderId, not parentId
      mockFetchSuccess(createPaginatedResponse([]));

      await folderHandlers.list_folders({ folderId: 'parent-123' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('folderId=parent-123');
    });

    it('should apply starred filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await folderHandlers.list_folders({ starred: true });

      const { url } = getFetchCallDetails();
      expect(url).toContain('starred=true');
    });

    it('should apply shared filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await folderHandlers.list_folders({ shared: true });

      const { url } = getFetchCallDetails();
      expect(url).toContain('shared=true');
    });

    it('should apply trashed filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await folderHandlers.list_folders({ trashed: false });

      const { url } = getFetchCallDetails();
      expect(url).toContain('trashed=false');
    });

    it('should apply search filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await folderHandlers.list_folders({ search: 'documents' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('search=documents');
    });

    it('should apply pagination parameters', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await folderHandlers.list_folders({ limit: 25, offset: 50 });

      const { url } = getFetchCallDetails();
      expect(url).toContain('limit=25');
      expect(url).toContain('offset=50');
    });

    it('should apply sort parameters', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await folderHandlers.list_folders({ sortBy: 'name', sortOrder: 'desc' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('sortBy=name');
      expect(url).toContain('sortOrder=desc');
    });

    it('should apply multiple filters', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await folderHandlers.list_folders({
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

      const result = await folderHandlers.list_folders({});
      const parsed = JSON.parse(result);

      expect(parsed.data).toEqual([]);
      expect(parsed.pagination.total).toBe(0);
    });

    it('should handle max limit (100)', async () => {
      const folders = createMockFolders(100);
      mockFetchSuccess(createPaginatedResponse(folders, { total: 250, limit: 100, hasMore: true }));

      const result = await folderHandlers.list_folders({ limit: 100 });
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(100);
      expect(parsed.pagination.hasMore).toBe(true);
    });

    it('should reject limit above max', async () => {
      await expect(folderHandlers.list_folders({ limit: 200 })).rejects.toThrow();
    });

    it('should reject negative offset', async () => {
      await expect(folderHandlers.list_folders({ offset: -1 })).rejects.toThrow();
    });

    it('should reject invalid sortBy', async () => {
      await expect(
        folderHandlers.list_folders({ sortBy: 'invalid' as unknown as 'name' })
      ).rejects.toThrow();
    });
  });

  describe('create_folder', () => {
    it('should create folder at root', async () => {
      const newFolder = createMockFolder({ id: 'folder-new', name: 'New Folder' });
      mockFetchSuccess(newFolder);

      const result = await folderHandlers.create_folder({ name: 'New Folder' });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('New Folder');
      assertFetchCalledWith({
        url: '/api/v1/folders',
        method: 'POST',
      });
    });

    it('should create folder with parent', async () => {
      const newFolder = createMockFolder({
        id: 'folder-new',
        name: 'Subfolder',
        parentId: 'parent-123',
      });
      mockFetchSuccess(newFolder);

      const result = await folderHandlers.create_folder({
        name: 'Subfolder',
        parentId: 'parent-123',
      });
      const parsed = JSON.parse(result);

      expect(parsed.parentId).toBe('parent-123');
      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ name: 'Subfolder', parentId: 'parent-123' });
    });

    it('should create folder with description', async () => {
      const newFolder = createMockFolder({
        id: 'folder-new',
        name: 'Documented',
        description: 'A folder with description',
      });
      mockFetchSuccess(newFolder);

      await folderHandlers.create_folder({
        name: 'Documented',
        description: 'A folder with description',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ description: 'A folder with description' });
    });

    it('should throw on missing name', async () => {
      await expectToThrowZodError(() => folderHandlers.create_folder({}), 'Required');
    });

    it('should throw on empty name', async () => {
      await expectToThrowZodError(
        () => folderHandlers.create_folder({ name: '' }),
        'cannot be empty'
      );
    });

    it('should handle 409 conflict for duplicate name', async () => {
      mockFetchErrorResponse(409, 'Folder with this name already exists');

      await expect(folderHandlers.create_folder({ name: 'Existing' })).rejects.toThrow();
    });
  });

  describe('get_folder', () => {
    it('should get folder by ID', async () => {
      const folder = createMockFolder({ id: 'folder-123', name: 'Documents' });
      mockFetchSuccess(folder);

      const result = await folderHandlers.get_folder({ folderId: 'folder-123' });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('folder-123');
      expect(parsed.name).toBe('Documents');
      assertFetchCalledWith({
        url: '/api/v1/folders/folder-123',
        method: 'GET',
      });
    });

    it('should throw on missing folderId', async () => {
      await expectToThrowZodError(() => folderHandlers.get_folder({}), 'Required');
    });

    it('should throw on empty folderId', async () => {
      await expectToThrowZodError(
        () => folderHandlers.get_folder({ folderId: '' }),
        'ID is required'
      );
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'Folder not found');

      await expect(folderHandlers.get_folder({ folderId: 'nonexistent' })).rejects.toThrow();
    });

    it('should return folder with all properties', async () => {
      mockFetchSuccess(folderFixtures.starred);

      const result = await folderHandlers.get_folder({ folderId: 'folder-starred-001' });
      const parsed = JSON.parse(result);

      expect(parsed.isStarred).toBe(true);
      expect(parsed.color).toBeDefined();
      expect(parsed.fileCount).toBeDefined();
    });

    it('should return folder with path', async () => {
      mockFetchSuccess(folderWithPathFixtures.nestedFolder);

      const result = await folderHandlers.get_folder({ folderId: 'folder-nested-001' });
      const parsed = JSON.parse(result);

      expect(parsed.path).toBeDefined();
      expect(parsed.path).toHaveLength(1);
    });
  });

  describe('update_folder', () => {
    it('should update folder name', async () => {
      const updatedFolder = createMockFolder({ id: 'folder-123', name: 'Renamed' });
      mockFetchSuccess(updatedFolder);

      const result = await folderHandlers.update_folder({
        folderId: 'folder-123',
        name: 'Renamed',
      });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('Renamed');
      assertFetchCalledWith({
        url: '/api/v1/folders/folder-123',
        method: 'PATCH',
      });
    });

    it('should update folder description', async () => {
      mockFetchSuccess(createMockFolder({ id: 'folder-123' }));

      await folderHandlers.update_folder({
        folderId: 'folder-123',
        description: 'New description',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ description: 'New description' });
    });

    it('should update folder color', async () => {
      mockFetchSuccess(createMockFolder({ id: 'folder-123', color: '#FF5733' }));

      await folderHandlers.update_folder({
        folderId: 'folder-123',
        color: '#FF5733',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ color: '#FF5733' });
    });

    it('should update folder starred status', async () => {
      mockFetchSuccess(createMockFolder({ id: 'folder-123', isStarred: true }));

      await folderHandlers.update_folder({
        folderId: 'folder-123',
        isStarred: true,
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ isStarred: true });
    });

    it('should restore folder from trash', async () => {
      mockFetchSuccess(createMockFolder({ id: 'folder-123', isTrashed: false }));

      await folderHandlers.update_folder({
        folderId: 'folder-123',
        action: 'restore',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ action: 'restore' });
    });

    it('should clear description with null', async () => {
      mockFetchSuccess(createMockFolder({ id: 'folder-123', description: null }));

      await folderHandlers.update_folder({
        folderId: 'folder-123',
        description: null,
      });

      const { body } = getFetchCallDetails();
      expect(body).toHaveProperty('description', null);
    });

    it('should throw on missing folderId', async () => {
      await expectToThrowZodError(() => folderHandlers.update_folder({ name: 'test' }), 'Required');
    });

    it('should throw on invalid color format', async () => {
      await expectToThrowZodError(
        () =>
          folderHandlers.update_folder({
            folderId: 'folder-123',
            color: 'invalid',
          }),
        'Invalid hex color'
      );
    });

    it('should throw on invalid action', async () => {
      await expect(
        folderHandlers.update_folder({
          folderId: 'folder-123',
          action: 'invalid' as 'restore',
        })
      ).rejects.toThrow(ZodError);
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'Folder not found');

      await expect(
        folderHandlers.update_folder({ folderId: 'nonexistent', name: 'test' })
      ).rejects.toThrow();
    });
  });

  describe('delete_folder', () => {
    it('should soft delete folder by default', async () => {
      mockFetchSuccess({ success: true, message: 'Folder moved to trash' });

      const result = await folderHandlers.delete_folder({ folderId: 'folder-123' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      assertFetchCalledWith({
        url: '/api/v1/folders/folder-123',
        method: 'DELETE',
      });
    });

    it('should apply permanent=false by default', async () => {
      mockFetchSuccess({ success: true });

      await folderHandlers.delete_folder({ folderId: 'folder-123' });

      const { url } = getFetchCallDetails();
      expect(url).toContain('permanent=false');
    });

    it('should permanent delete when specified', async () => {
      mockFetchSuccess({ success: true, message: 'Folder permanently deleted' });

      await folderHandlers.delete_folder({
        folderId: 'folder-123',
        permanent: true,
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('permanent=true');
    });

    it('should throw on missing folderId', async () => {
      await expectToThrowZodError(() => folderHandlers.delete_folder({}), 'Required');
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'Folder not found');

      await expect(folderHandlers.delete_folder({ folderId: 'nonexistent' })).rejects.toThrow();
    });

    it('should handle folder with contents', async () => {
      mockFetchErrorResponse(409, 'Folder is not empty');

      await expect(
        folderHandlers.delete_folder({ folderId: 'non-empty', permanent: true })
      ).rejects.toThrow();
    });
  });

  describe('move_folder', () => {
    it('should move folder to parent', async () => {
      const movedFolder = createMockFolder({ id: 'folder-123', parentId: 'parent-456' });
      mockFetchSuccess(movedFolder);

      const result = await folderHandlers.move_folder({
        folderId: 'folder-123',
        parentId: 'parent-456',
      });
      const parsed = JSON.parse(result);

      expect(parsed.parentId).toBe('parent-456');
      assertFetchCalledWith({
        url: '/api/v1/folders/folder-123/move',
        method: 'PUT',
      });
    });

    it('should move folder to root (null parentId)', async () => {
      const movedFolder = createMockFolder({ id: 'folder-123', parentId: null });
      mockFetchSuccess(movedFolder);

      const result = await folderHandlers.move_folder({
        folderId: 'folder-123',
        parentId: null,
      });
      const parsed = JSON.parse(result);

      expect(parsed.parentId).toBeNull();
    });

    it('should move folder to root (undefined parentId)', async () => {
      const movedFolder = createMockFolder({ id: 'folder-123', parentId: null });
      mockFetchSuccess(movedFolder);

      await folderHandlers.move_folder({ folderId: 'folder-123' });

      const { body } = getFetchCallDetails();
      expect(body).toHaveProperty('parentId');
    });

    it('should throw on missing folderId', async () => {
      await expectToThrowZodError(
        () => folderHandlers.move_folder({ parentId: 'parent-123' }),
        'Required'
      );
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'Folder not found');

      await expect(
        folderHandlers.move_folder({ folderId: 'nonexistent', parentId: 'parent-123' })
      ).rejects.toThrow();
    });

    it('should handle circular reference', async () => {
      mockFetchErrorResponse(400, 'Cannot move folder into itself or its descendants');

      await expect(
        folderHandlers.move_folder({ folderId: 'folder-123', parentId: 'folder-123' })
      ).rejects.toThrow();
    });
  });

  describe('share_folder', () => {
    it('should share folder with single email', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      const result = await folderHandlers.share_folder({
        folderId: 'folder-123',
        emails: ['user@example.com'],
      });
      const parsed = JSON.parse(result);

      expect(parsed.sharedWith).toContain('user@example.com');
      assertFetchCalledWith({
        url: '/api/v1/folders/folder-123/share',
        method: 'POST',
      });
    });

    it('should share folder with multiple emails', async () => {
      const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      mockFetchSuccess(mockApiResponses.shareSuccess(emails));

      const result = await folderHandlers.share_folder({
        folderId: 'folder-123',
        emails,
      });
      const parsed = JSON.parse(result);

      expect(parsed.sharedWith).toHaveLength(3);
    });

    it('should apply default role (viewer)', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      await folderHandlers.share_folder({
        folderId: 'folder-123',
        emails: ['user@example.com'],
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ role: 'viewer' });
    });

    it('should apply editor role', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      await folderHandlers.share_folder({
        folderId: 'folder-123',
        emails: ['user@example.com'],
        role: 'editor',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ role: 'editor' });
    });

    it('should apply canShare option', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      await folderHandlers.share_folder({
        folderId: 'folder-123',
        emails: ['user@example.com'],
        canShare: true,
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ canShare: true });
    });

    it('should apply message option', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      await folderHandlers.share_folder({
        folderId: 'folder-123',
        emails: ['user@example.com'],
        message: 'Please check this folder',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ message: 'Please check this folder' });
    });

    it('should throw on missing folderId', async () => {
      await expectToThrowZodError(
        () => folderHandlers.share_folder({ emails: ['user@example.com'] }),
        'Required'
      );
    });

    it('should throw on missing emails', async () => {
      await expect(folderHandlers.share_folder({ folderId: 'folder-123' })).rejects.toThrow(
        ZodError
      );
    });

    it('should throw on empty emails array', async () => {
      await expectToThrowZodError(
        () => folderHandlers.share_folder({ folderId: 'folder-123', emails: [] }),
        'At least one email'
      );
    });

    it('should throw on invalid email format', async () => {
      await expectToThrowZodError(
        () =>
          folderHandlers.share_folder({
            folderId: 'folder-123',
            emails: ['invalid-email'],
          }),
        'Invalid email'
      );
    });

    it('should throw on invalid role', async () => {
      await expect(
        folderHandlers.share_folder({
          folderId: 'folder-123',
          emails: ['user@example.com'],
          role: 'admin' as 'viewer' | 'editor',
        })
      ).rejects.toThrow(ZodError);
    });
  });

  describe('executeFolderTool', () => {
    it('should route to list_folders', async () => {
      const folders = createMockFolders(3);
      mockFetchSuccess(createPaginatedResponse(folders));

      const result = await executeFolderTool('list_folders', {});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(3);
    });

    it('should route to create_folder', async () => {
      mockFetchSuccess(createMockFolder({ id: 'folder-new', name: 'Test' }));

      const result = await executeFolderTool('create_folder', { name: 'Test' });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('Test');
    });

    it('should route to get_folder', async () => {
      mockFetchSuccess(createMockFolder({ id: 'folder-test' }));

      const result = await executeFolderTool('get_folder', { folderId: 'folder-test' });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('folder-test');
    });

    it('should route to update_folder', async () => {
      mockFetchSuccess(createMockFolder({ id: 'folder-test', name: 'Updated' }));

      const result = await executeFolderTool('update_folder', {
        folderId: 'folder-test',
        name: 'Updated',
      });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('Updated');
    });

    it('should route to delete_folder', async () => {
      mockFetchSuccess({ success: true });

      const result = await executeFolderTool('delete_folder', { folderId: 'folder-test' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
    });

    it('should route to move_folder', async () => {
      mockFetchSuccess(createMockFolder({ id: 'folder-test', parentId: 'parent-new' }));

      const result = await executeFolderTool('move_folder', {
        folderId: 'folder-test',
        parentId: 'parent-new',
      });
      const parsed = JSON.parse(result);

      expect(parsed.parentId).toBe('parent-new');
    });

    it('should route to share_folder', async () => {
      mockFetchSuccess(mockApiResponses.shareSuccess(['user@example.com']));

      const result = await executeFolderTool('share_folder', {
        folderId: 'folder-test',
        emails: ['user@example.com'],
      });
      const parsed = JSON.parse(result);

      expect(parsed.sharedWith).toContain('user@example.com');
    });
  });
});
