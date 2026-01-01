/**
 * Entity mock factories for testing
 */

import type {
  ZeroDriveFile,
  Folder,
  Workspace,
  WorkspaceFile,
  WorkspaceFolder,
  TrashItem,
  ShareInfo,
  WorkspaceMember,
} from '../../src/types/entities.js';

/**
 * Generate a unique test ID
 */
export function generateTestId(): string {
  const uuid = Math.random().toString(36).substring(2, 10);
  return `test-${uuid}`;
}

/**
 * Create a mock file entity
 */
export function createMockFile(overrides: Partial<ZeroDriveFile> = {}): ZeroDriveFile {
  const id = overrides.id ?? generateTestId();
  const now = new Date().toISOString();

  return {
    id,
    name: `test-file-${id}.txt`,
    size: 1024,
    mimeType: 'text/plain',
    folderId: null,
    extension: 'txt',
    createdAt: now,
    updatedAt: now,
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    ...overrides,
  };
}

/**
 * Create multiple mock files
 */
export function createMockFiles(
  count: number,
  overrides: Partial<ZeroDriveFile> = {}
): ZeroDriveFile[] {
  return Array.from({ length: count }, () => createMockFile(overrides));
}

/**
 * Create a mock folder entity
 */
export function createMockFolder(overrides: Partial<Folder> = {}): Folder {
  const id = overrides.id ?? generateTestId();
  const now = new Date().toISOString();

  return {
    id,
    name: `test-folder-${id}`,
    parentId: null,
    description: null,
    color: null,
    createdAt: now,
    updatedAt: now,
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    fileCount: 0,
    folderCount: 0,
    totalSize: 0,
    ...overrides,
  };
}

/**
 * Create multiple mock folders
 */
export function createMockFolders(count: number, overrides: Partial<Folder> = {}): Folder[] {
  return Array.from({ length: count }, () => createMockFolder(overrides));
}

/**
 * Create a mock workspace entity
 */
export function createMockWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  const id = overrides.id ?? generateTestId();
  const now = new Date().toISOString();

  return {
    id,
    name: `test-workspace-${id}`,
    description: null,
    icon: null,
    color: null,
    storageAllocation: 100 * 1024 * 1024, // 100MB
    storageUsed: 0,
    ownerId: 'user-123',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create multiple mock workspaces
 */
export function createMockWorkspaces(
  count: number,
  overrides: Partial<Workspace> = {}
): Workspace[] {
  return Array.from({ length: count }, () => createMockWorkspace(overrides));
}

/**
 * Create a mock workspace file entity
 */
export function createMockWorkspaceFile(overrides: Partial<WorkspaceFile> = {}): WorkspaceFile {
  const baseFile = createMockFile(overrides);
  return {
    ...baseFile,
    workspaceId: overrides.workspaceId ?? generateTestId(),
    ...overrides,
  };
}

/**
 * Create multiple mock workspace files
 */
export function createMockWorkspaceFiles(
  count: number,
  overrides: Partial<WorkspaceFile> = {}
): WorkspaceFile[] {
  return Array.from({ length: count }, () => createMockWorkspaceFile(overrides));
}

/**
 * Create a mock workspace folder entity
 */
export function createMockWorkspaceFolder(
  overrides: Partial<WorkspaceFolder> = {}
): WorkspaceFolder {
  const baseFolder = createMockFolder(overrides);
  return {
    ...baseFolder,
    workspaceId: overrides.workspaceId ?? generateTestId(),
    ...overrides,
  };
}

/**
 * Create multiple mock workspace folders
 */
export function createMockWorkspaceFolders(
  count: number,
  overrides: Partial<WorkspaceFolder> = {}
): WorkspaceFolder[] {
  return Array.from({ length: count }, () => createMockWorkspaceFolder(overrides));
}

/**
 * Create a mock trash item
 */
export function createMockTrashItem(overrides: Partial<TrashItem> = {}): TrashItem {
  const id = overrides.id ?? generateTestId();
  const now = new Date().toISOString();

  return {
    id,
    name: `test-trash-${id}`,
    type: 'file',
    size: 1024,
    mimeType: 'text/plain',
    originalParentId: null,
    trashedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create multiple mock trash items
 */
export function createMockTrashItems(
  count: number,
  overrides: Partial<TrashItem> = {}
): TrashItem[] {
  return Array.from({ length: count }, () => createMockTrashItem(overrides));
}

/**
 * Create a mock share info
 */
export function createMockShareInfo(overrides: Partial<ShareInfo> = {}): ShareInfo {
  const id = overrides.id ?? generateTestId();
  const now = new Date().toISOString();

  return {
    id,
    email: 'test@example.com',
    role: 'viewer',
    canShare: false,
    createdAt: now,
    message: null,
    ...overrides,
  };
}

/**
 * Create a mock workspace member
 */
export function createMockWorkspaceMember(
  overrides: Partial<WorkspaceMember> = {}
): WorkspaceMember {
  const now = new Date().toISOString();

  return {
    userId: overrides.userId ?? generateTestId(),
    email: 'member@example.com',
    displayName: 'Test Member',
    role: 'VIEWER',
    joinedAt: now,
    ...overrides,
  };
}

/**
 * Common test fixtures for reuse
 */
export const fixtures = {
  files: {
    basic: createMockFile({ id: 'file-basic', name: 'document.pdf', mimeType: 'application/pdf' }),
    starred: createMockFile({ id: 'file-starred', isStarred: true }),
    shared: createMockFile({ id: 'file-shared', isShared: true }),
    trashed: createMockFile({
      id: 'file-trashed',
      isTrashed: true,
      trashedAt: new Date().toISOString(),
    }),
    inFolder: createMockFile({ id: 'file-in-folder', folderId: 'folder-parent' }),
    large: createMockFile({ id: 'file-large', size: 100 * 1024 * 1024 }),
    image: createMockFile({
      id: 'file-image',
      name: 'photo.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
    }),
  },
  folders: {
    basic: createMockFolder({ id: 'folder-basic', name: 'Documents' }),
    starred: createMockFolder({ id: 'folder-starred', isStarred: true }),
    shared: createMockFolder({ id: 'folder-shared', isShared: true }),
    trashed: createMockFolder({ id: 'folder-trashed', isTrashed: true }),
    nested: createMockFolder({ id: 'folder-nested', parentId: 'folder-parent' }),
    withColor: createMockFolder({ id: 'folder-color', color: '#FF5733' }),
  },
  workspaces: {
    basic: createMockWorkspace({ id: 'workspace-basic', name: 'Team Workspace' }),
    large: createMockWorkspace({
      id: 'workspace-large',
      storageAllocation: 1024 * 1024 * 1024,
      storageUsed: 500 * 1024 * 1024,
    }),
  },
  trash: {
    file: createMockTrashItem({ id: 'trash-file', type: 'file' }),
    folder: createMockTrashItem({
      id: 'trash-folder',
      type: 'folder',
      size: undefined,
      mimeType: undefined,
    }),
  },
};
