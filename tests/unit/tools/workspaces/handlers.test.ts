/**
 * Unit tests for workspace tool handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ZodError } from 'zod';
import {
  workspaceHandlers,
  executeWorkspaceTool,
} from '../../../../src/tools/workspaces/handlers.js';
import {
  mockFetchSuccess,
  mockFetchErrorResponse,
  assertFetchCalledWith,
  getFetchCallDetails,
} from '../../../mocks/fetch.mock.js';
import {
  createMockWorkspace,
  createMockWorkspaceFolder,
  createMockWorkspaceFile,
  createMockWorkspaces,
  createMockWorkspaceFolders,
  createMockWorkspaceFiles,
} from '../../../mocks/entities.mock.js';
import { createPaginatedResponse } from '../../../mocks/responses.mock.js';
import {
  workspaceFixtures,
  workspaceWithMembersFixtures,
  workspaceListFixtures,
  workspaceFolderFixtures,
  workspaceFileFixtures,
} from '../../../fixtures/data/workspaces.fixture.js';

// 100MB minimum storage allocation
const MIN_STORAGE = 100 * 1024 * 1024;

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

describe('Workspace Tool Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list_workspaces', () => {
    it('should list all workspaces', async () => {
      mockFetchSuccess(workspaceListFixtures.mixed);

      const result = await workspaceHandlers.list_workspaces({});
      const parsed = JSON.parse(result);

      expect(parsed.owned).toBeDefined();
      expect(parsed.member).toBeDefined();
      assertFetchCalledWith({
        url: '/api/v1/workspaces',
        method: 'GET',
      });
    });

    it('should return owned workspaces', async () => {
      mockFetchSuccess(workspaceListFixtures.ownedOnly);

      const result = await workspaceHandlers.list_workspaces({});
      const parsed = JSON.parse(result);

      expect(parsed.owned).toHaveLength(2);
      expect(parsed.member).toHaveLength(0);
    });

    it('should return member workspaces', async () => {
      mockFetchSuccess(workspaceListFixtures.memberOnly);

      const result = await workspaceHandlers.list_workspaces({});
      const parsed = JSON.parse(result);

      expect(parsed.owned).toHaveLength(0);
      expect(parsed.member).toHaveLength(1);
    });

    it('should handle empty workspace list', async () => {
      mockFetchSuccess(workspaceListFixtures.empty);

      const result = await workspaceHandlers.list_workspaces({});
      const parsed = JSON.parse(result);

      expect(parsed.owned).toEqual([]);
      expect(parsed.member).toEqual([]);
    });
  });

  describe('create_workspace', () => {
    it('should create workspace with minimum storage', async () => {
      const newWorkspace = createMockWorkspace({
        id: 'ws-new',
        name: 'New Workspace',
        storageAllocation: MIN_STORAGE,
      });
      mockFetchSuccess(newWorkspace);

      const result = await workspaceHandlers.create_workspace({
        name: 'New Workspace',
        storageAllocation: MIN_STORAGE,
      });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('New Workspace');
      expect(parsed.storageAllocation).toBe(MIN_STORAGE);
      assertFetchCalledWith({
        url: '/api/v1/workspaces',
        method: 'POST',
      });
    });

    it('should create workspace with description', async () => {
      mockFetchSuccess(createMockWorkspace({ id: 'ws-new' }));

      await workspaceHandlers.create_workspace({
        name: 'Test Workspace',
        storageAllocation: MIN_STORAGE,
        description: 'A test workspace',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ description: 'A test workspace' });
    });

    it('should create workspace with icon and color', async () => {
      mockFetchSuccess(createMockWorkspace({ id: 'ws-new' }));

      await workspaceHandlers.create_workspace({
        name: 'Styled Workspace',
        storageAllocation: MIN_STORAGE,
        icon: 'folder',
        color: '#3498DB',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ icon: 'folder', color: '#3498DB' });
    });

    it('should accept storage allocation as string', async () => {
      mockFetchSuccess(createMockWorkspace({ id: 'ws-new' }));

      await workspaceHandlers.create_workspace({
        name: 'Test Workspace',
        storageAllocation: String(MIN_STORAGE),
      });

      const { body } = getFetchCallDetails();
      expect(body.storageAllocation).toBe(MIN_STORAGE);
    });

    it('should throw on missing name', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.create_workspace({ storageAllocation: MIN_STORAGE }),
        'Required'
      );
    });

    it('should throw on empty name', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.create_workspace({ name: '', storageAllocation: MIN_STORAGE }),
        'cannot be empty'
      );
    });

    it('should throw on name exceeding 100 characters', async () => {
      await expectToThrowZodError(
        () =>
          workspaceHandlers.create_workspace({
            name: 'x'.repeat(101),
            storageAllocation: MIN_STORAGE,
          }),
        'cannot exceed 100'
      );
    });

    it('should throw on missing storageAllocation', async () => {
      // Union type gives "Invalid input" error for missing value
      await expect(workspaceHandlers.create_workspace({ name: 'Test' })).rejects.toThrow(ZodError);
    });

    it('should throw on storage below minimum', async () => {
      await expectToThrowZodError(
        () =>
          workspaceHandlers.create_workspace({
            name: 'Test',
            storageAllocation: 50 * 1024 * 1024, // 50MB
          }),
        'Minimum storage'
      );
    });

    it('should throw on invalid color format', async () => {
      await expectToThrowZodError(
        () =>
          workspaceHandlers.create_workspace({
            name: 'Test',
            storageAllocation: MIN_STORAGE,
            color: 'invalid',
          }),
        'Invalid hex color'
      );
    });
  });

  describe('get_workspace', () => {
    it('should get workspace by ID', async () => {
      mockFetchSuccess(workspaceWithMembersFixtures.withTeam);

      const result = await workspaceHandlers.get_workspace({ workspaceId: 'workspace-basic-001' });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('workspace-basic-001');
      expect(parsed.members).toBeDefined();
      assertFetchCalledWith({
        url: '/api/v1/workspaces/workspace-basic-001',
        method: 'GET',
      });
    });

    it('should return workspace with role', async () => {
      mockFetchSuccess(workspaceWithMembersFixtures.asEditor);

      const result = await workspaceHandlers.get_workspace({ workspaceId: 'workspace-basic-001' });
      const parsed = JSON.parse(result);

      expect(parsed.currentUserRole).toBe('EDITOR');
    });

    it('should throw on missing workspaceId', async () => {
      await expectToThrowZodError(() => workspaceHandlers.get_workspace({}), 'Required');
    });

    it('should throw on empty workspaceId', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.get_workspace({ workspaceId: '' }),
        'ID is required'
      );
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'Workspace not found');

      await expect(
        workspaceHandlers.get_workspace({ workspaceId: 'nonexistent' })
      ).rejects.toThrow();
    });
  });

  describe('upload_workspace_file', () => {
    it('should throw on missing workspaceId', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.upload_workspace_file({ filePath: '/test/file.txt' }),
        'Required'
      );
    });

    it('should throw on missing filePath', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.upload_workspace_file({ workspaceId: 'ws-123' }),
        'Required'
      );
    });

    it('should throw on empty filePath', async () => {
      await expectToThrowZodError(
        () =>
          workspaceHandlers.upload_workspace_file({
            workspaceId: 'ws-123',
            filePath: '',
          }),
        'File path is required'
      );
    });

    // Note: Full upload tests require mocking file system operations
  });

  describe('list_workspace_files', () => {
    it('should list workspace files', async () => {
      const files = createMockWorkspaceFiles(5);
      mockFetchSuccess(createPaginatedResponse(files));

      const result = await workspaceHandlers.list_workspace_files({ workspaceId: 'ws-123' });
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(5);
      assertFetchCalledWith({
        url: '/api/v1/workspaces/ws-123/files',
        method: 'GET',
      });
    });

    it('should apply folderId filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_files({
        workspaceId: 'ws-123',
        folderId: 'folder-456',
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('folderId=folder-456');
    });

    it('should apply starred filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_files({
        workspaceId: 'ws-123',
        starred: true,
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('starred=true');
    });

    it('should apply trashed filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_files({
        workspaceId: 'ws-123',
        trashed: false,
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('trashed=false');
    });

    it('should apply search filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_files({
        workspaceId: 'ws-123',
        search: 'report',
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('search=report');
    });

    it('should apply pagination', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_files({
        workspaceId: 'ws-123',
        limit: 25,
        offset: 50,
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('limit=25');
      expect(url).toContain('offset=50');
    });

    it('should apply sort', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_files({
        workspaceId: 'ws-123',
        sortBy: 'size',
        sortOrder: 'desc',
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('sortBy=size');
      expect(url).toContain('sortOrder=desc');
    });

    it('should throw on missing workspaceId', async () => {
      await expectToThrowZodError(() => workspaceHandlers.list_workspace_files({}), 'Required');
    });
  });

  describe('list_workspace_folders', () => {
    it('should list workspace folders', async () => {
      const folders = createMockWorkspaceFolders(3);
      mockFetchSuccess(createPaginatedResponse(folders));

      const result = await workspaceHandlers.list_workspace_folders({ workspaceId: 'ws-123' });
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(3);
      assertFetchCalledWith({
        url: '/api/v1/workspaces/ws-123/folders',
        method: 'GET',
      });
    });

    it('should apply parentId filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_folders({
        workspaceId: 'ws-123',
        parentId: 'parent-456',
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('parentId=parent-456');
    });

    it('should apply starred filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_folders({
        workspaceId: 'ws-123',
        starred: true,
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('starred=true');
    });

    it('should apply trashed filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_folders({
        workspaceId: 'ws-123',
        trashed: false,
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('trashed=false');
    });

    it('should apply search filter', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_folders({
        workspaceId: 'ws-123',
        search: 'projects',
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('search=projects');
    });

    it('should apply pagination', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_folders({
        workspaceId: 'ws-123',
        limit: 25,
        offset: 50,
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('limit=25');
      expect(url).toContain('offset=50');
    });

    it('should apply sort', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      await workspaceHandlers.list_workspace_folders({
        workspaceId: 'ws-123',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('sortBy=name');
      expect(url).toContain('sortOrder=asc');
    });

    it('should throw on missing workspaceId', async () => {
      await expectToThrowZodError(() => workspaceHandlers.list_workspace_folders({}), 'Required');
    });
  });

  describe('create_workspace_folder', () => {
    it('should create folder in workspace root', async () => {
      const newFolder = createMockWorkspaceFolder({
        id: 'ws-folder-new',
        name: 'New Folder',
        workspaceId: 'ws-123',
      });
      mockFetchSuccess(newFolder);

      const result = await workspaceHandlers.create_workspace_folder({
        workspaceId: 'ws-123',
        name: 'New Folder',
      });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('New Folder');
      assertFetchCalledWith({
        url: '/api/v1/workspaces/ws-123/folders',
        method: 'POST',
      });
    });

    it('should create nested folder', async () => {
      const newFolder = createMockWorkspaceFolder({
        id: 'ws-folder-new',
        name: 'Subfolder',
        parentId: 'parent-123',
      });
      mockFetchSuccess(newFolder);

      const result = await workspaceHandlers.create_workspace_folder({
        workspaceId: 'ws-123',
        name: 'Subfolder',
        parentId: 'parent-123',
      });
      const parsed = JSON.parse(result);

      expect(parsed.parentId).toBe('parent-123');
      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ parentId: 'parent-123' });
    });

    it('should create folder with description', async () => {
      mockFetchSuccess(createMockWorkspaceFolder({ id: 'ws-folder-new' }));

      await workspaceHandlers.create_workspace_folder({
        workspaceId: 'ws-123',
        name: 'Documented',
        description: 'A documented folder',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ description: 'A documented folder' });
    });

    it('should create folder with color', async () => {
      mockFetchSuccess(createMockWorkspaceFolder({ id: 'ws-folder-new', color: '#FF5733' }));

      await workspaceHandlers.create_workspace_folder({
        workspaceId: 'ws-123',
        name: 'Colored',
        color: '#FF5733',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ color: '#FF5733' });
    });

    it('should throw on missing workspaceId', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.create_workspace_folder({ name: 'Test' }),
        'Required'
      );
    });

    it('should throw on missing name', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.create_workspace_folder({ workspaceId: 'ws-123' }),
        'Required'
      );
    });

    it('should throw on name exceeding 255 characters', async () => {
      await expectToThrowZodError(
        () =>
          workspaceHandlers.create_workspace_folder({
            workspaceId: 'ws-123',
            name: 'x'.repeat(256),
          }),
        'cannot exceed 255'
      );
    });

    it('should throw on invalid color format', async () => {
      await expectToThrowZodError(
        () =>
          workspaceHandlers.create_workspace_folder({
            workspaceId: 'ws-123',
            name: 'Test',
            color: 'red',
          }),
        'Invalid hex color'
      );
    });
  });

  describe('get_workspace_folder', () => {
    it('should get workspace folder by ID', async () => {
      mockFetchSuccess(workspaceFolderFixtures.basic);

      const result = await workspaceHandlers.get_workspace_folder({
        workspaceId: 'workspace-basic-001',
        folderId: 'ws-folder-001',
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('ws-folder-001');
      expect(parsed.name).toBe('Projects');
      assertFetchCalledWith({
        url: '/api/v1/workspaces/workspace-basic-001/folders/ws-folder-001',
        method: 'GET',
      });
    });

    it('should throw on missing workspaceId', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.get_workspace_folder({ folderId: 'folder-123' }),
        'Required'
      );
    });

    it('should throw on missing folderId', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.get_workspace_folder({ workspaceId: 'ws-123' }),
        'Required'
      );
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'Folder not found');

      await expect(
        workspaceHandlers.get_workspace_folder({
          workspaceId: 'ws-123',
          folderId: 'nonexistent',
        })
      ).rejects.toThrow();
    });
  });

  describe('update_workspace_folder', () => {
    it('should update folder name', async () => {
      const updatedFolder = createMockWorkspaceFolder({ id: 'ws-folder-123', name: 'Renamed' });
      mockFetchSuccess(updatedFolder);

      const result = await workspaceHandlers.update_workspace_folder({
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
        name: 'Renamed',
      });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('Renamed');
      assertFetchCalledWith({
        url: '/api/v1/workspaces/ws-123/folders/ws-folder-123',
        method: 'PATCH',
      });
    });

    it('should update folder description', async () => {
      mockFetchSuccess(createMockWorkspaceFolder({ id: 'ws-folder-123' }));

      await workspaceHandlers.update_workspace_folder({
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
        description: 'New description',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ description: 'New description' });
    });

    it('should update folder color', async () => {
      mockFetchSuccess(createMockWorkspaceFolder({ id: 'ws-folder-123', color: '#3498DB' }));

      await workspaceHandlers.update_workspace_folder({
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
        color: '#3498DB',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ color: '#3498DB' });
    });

    it('should move folder to new parent', async () => {
      mockFetchSuccess(createMockWorkspaceFolder({ id: 'ws-folder-123', parentId: 'new-parent' }));

      await workspaceHandlers.update_workspace_folder({
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
        parentId: 'new-parent',
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ parentId: 'new-parent' });
    });

    it('should update starred status', async () => {
      mockFetchSuccess(createMockWorkspaceFolder({ id: 'ws-folder-123', isStarred: true }));

      await workspaceHandlers.update_workspace_folder({
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
        isStarred: true,
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ isStarred: true });
    });

    it('should update trashed status', async () => {
      mockFetchSuccess(createMockWorkspaceFolder({ id: 'ws-folder-123', isTrashed: true }));

      await workspaceHandlers.update_workspace_folder({
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
        isTrashed: true,
      });

      const { body } = getFetchCallDetails();
      expect(body).toMatchObject({ isTrashed: true });
    });

    it('should throw on missing workspaceId', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.update_workspace_folder({ folderId: 'folder-123', name: 'test' }),
        'Required'
      );
    });

    it('should throw on missing folderId', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.update_workspace_folder({ workspaceId: 'ws-123', name: 'test' }),
        'Required'
      );
    });

    it('should throw on invalid color format', async () => {
      await expectToThrowZodError(
        () =>
          workspaceHandlers.update_workspace_folder({
            workspaceId: 'ws-123',
            folderId: 'folder-123',
            color: 'blue',
          }),
        'Invalid hex color'
      );
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'Folder not found');

      await expect(
        workspaceHandlers.update_workspace_folder({
          workspaceId: 'ws-123',
          folderId: 'nonexistent',
          name: 'test',
        })
      ).rejects.toThrow();
    });
  });

  describe('delete_workspace_folder', () => {
    it('should soft delete folder by default', async () => {
      mockFetchSuccess({ success: true, message: 'Folder moved to trash' });

      const result = await workspaceHandlers.delete_workspace_folder({
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
      });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      assertFetchCalledWith({
        url: '/api/v1/workspaces/ws-123/folders/ws-folder-123',
        method: 'DELETE',
      });
    });

    it('should apply permanent=false by default', async () => {
      mockFetchSuccess({ success: true });

      await workspaceHandlers.delete_workspace_folder({
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('permanent=false');
    });

    it('should permanent delete when specified', async () => {
      mockFetchSuccess({ success: true, message: 'Folder permanently deleted' });

      await workspaceHandlers.delete_workspace_folder({
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
        permanent: true,
      });

      const { url } = getFetchCallDetails();
      expect(url).toContain('permanent=true');
    });

    it('should throw on missing workspaceId', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.delete_workspace_folder({ folderId: 'folder-123' }),
        'Required'
      );
    });

    it('should throw on missing folderId', async () => {
      await expectToThrowZodError(
        () => workspaceHandlers.delete_workspace_folder({ workspaceId: 'ws-123' }),
        'Required'
      );
    });

    it('should handle 404 not found', async () => {
      mockFetchErrorResponse(404, 'Folder not found');

      await expect(
        workspaceHandlers.delete_workspace_folder({
          workspaceId: 'ws-123',
          folderId: 'nonexistent',
        })
      ).rejects.toThrow();
    });
  });

  describe('executeWorkspaceTool', () => {
    it('should route to list_workspaces', async () => {
      mockFetchSuccess(workspaceListFixtures.mixed);

      const result = await executeWorkspaceTool('list_workspaces', {});
      const parsed = JSON.parse(result);

      expect(parsed.owned).toBeDefined();
    });

    it('should route to create_workspace', async () => {
      mockFetchSuccess(createMockWorkspace({ id: 'ws-new', name: 'Test' }));

      const result = await executeWorkspaceTool('create_workspace', {
        name: 'Test',
        storageAllocation: MIN_STORAGE,
      });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('Test');
    });

    it('should route to get_workspace', async () => {
      mockFetchSuccess(workspaceWithMembersFixtures.withOwner);

      const result = await executeWorkspaceTool('get_workspace', {
        workspaceId: 'workspace-basic-001',
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('workspace-basic-001');
    });

    it('should route to list_workspace_files', async () => {
      mockFetchSuccess(createPaginatedResponse(createMockWorkspaceFiles(3)));

      const result = await executeWorkspaceTool('list_workspace_files', {
        workspaceId: 'ws-123',
      });
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(3);
    });

    it('should route to list_workspace_folders', async () => {
      mockFetchSuccess(createPaginatedResponse(createMockWorkspaceFolders(2)));

      const result = await executeWorkspaceTool('list_workspace_folders', {
        workspaceId: 'ws-123',
      });
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(2);
    });

    it('should route to create_workspace_folder', async () => {
      mockFetchSuccess(createMockWorkspaceFolder({ id: 'ws-folder-new', name: 'Test' }));

      const result = await executeWorkspaceTool('create_workspace_folder', {
        workspaceId: 'ws-123',
        name: 'Test',
      });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('Test');
    });

    it('should route to get_workspace_folder', async () => {
      mockFetchSuccess(workspaceFolderFixtures.basic);

      const result = await executeWorkspaceTool('get_workspace_folder', {
        workspaceId: 'workspace-basic-001',
        folderId: 'ws-folder-001',
      });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('ws-folder-001');
    });

    it('should route to update_workspace_folder', async () => {
      mockFetchSuccess(createMockWorkspaceFolder({ id: 'ws-folder-123', name: 'Updated' }));

      const result = await executeWorkspaceTool('update_workspace_folder', {
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
        name: 'Updated',
      });
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('Updated');
    });

    it('should route to delete_workspace_folder', async () => {
      mockFetchSuccess({ success: true });

      const result = await executeWorkspaceTool('delete_workspace_folder', {
        workspaceId: 'ws-123',
        folderId: 'ws-folder-123',
      });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
    });
  });
});
