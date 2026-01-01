/**
 * Workspace entity fixtures for testing
 */

import type {
  Workspace,
  WorkspaceWithMembers,
  WorkspaceMember,
  WorkspaceFile,
  WorkspaceFolder,
  WorkspaceListResponse,
} from '../../../src/types/entities.js';

/**
 * Basic workspace fixtures
 */
export const workspaceFixtures: Record<string, Workspace> = {
  basic: {
    id: 'workspace-basic-001',
    name: 'Team Workspace',
    description: 'Main team collaboration space',
    icon: null,
    color: '#3498DB',
    storageAllocation: 1024 * 1024 * 1024, // 1GB
    storageUsed: 256 * 1024 * 1024, // 256MB
    ownerId: 'user-123',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-15T14:00:00Z',
  },
  minimal: {
    id: 'workspace-minimal-001',
    name: 'Personal Space',
    description: null,
    icon: null,
    color: null,
    storageAllocation: 100 * 1024 * 1024, // 100MB (minimum)
    storageUsed: 0,
    ownerId: 'user-123',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z',
  },
  large: {
    id: 'workspace-large-001',
    name: 'Enterprise Workspace',
    description: 'Large enterprise collaboration space with extended storage',
    icon: 'building',
    color: '#2ECC71',
    storageAllocation: 10 * 1024 * 1024 * 1024, // 10GB
    storageUsed: 5 * 1024 * 1024 * 1024, // 5GB
    ownerId: 'user-admin-001',
    createdAt: '2023-06-01T09:00:00Z',
    updatedAt: '2024-01-14T16:30:00Z',
  },
  nearFull: {
    id: 'workspace-near-full-001',
    name: 'Almost Full Workspace',
    description: 'Workspace nearing storage limit',
    icon: 'warning',
    color: '#E74C3C',
    storageAllocation: 500 * 1024 * 1024, // 500MB
    storageUsed: 490 * 1024 * 1024, // 490MB (98% used)
    ownerId: 'user-123',
    createdAt: '2023-12-01T10:00:00Z',
    updatedAt: '2024-01-15T11:00:00Z',
  },
};

/**
 * Workspace member fixtures
 */
export const memberFixtures: Record<string, WorkspaceMember> = {
  owner: {
    userId: 'user-123',
    email: 'owner@example.com',
    displayName: 'Workspace Owner',
    role: 'OWNER',
    joinedAt: '2024-01-01T10:00:00Z',
  },
  admin: {
    userId: 'user-admin-001',
    email: 'admin@example.com',
    displayName: 'Admin User',
    role: 'ADMIN',
    joinedAt: '2024-01-02T14:00:00Z',
  },
  editor: {
    userId: 'user-editor-001',
    email: 'editor@example.com',
    displayName: 'Editor User',
    role: 'EDITOR',
    joinedAt: '2024-01-05T09:00:00Z',
  },
  viewer: {
    userId: 'user-viewer-001',
    email: 'viewer@example.com',
    displayName: 'Viewer User',
    role: 'VIEWER',
    joinedAt: '2024-01-10T11:00:00Z',
  },
};

/**
 * Workspace with members fixtures
 */
export const workspaceWithMembersFixtures: Record<string, WorkspaceWithMembers> = {
  withOwner: {
    ...workspaceFixtures.basic,
    members: [memberFixtures.owner],
    currentUserRole: 'OWNER',
  },
  withTeam: {
    ...workspaceFixtures.basic,
    members: [
      memberFixtures.owner,
      memberFixtures.admin,
      memberFixtures.editor,
      memberFixtures.viewer,
    ],
    currentUserRole: 'OWNER',
  },
  asEditor: {
    ...workspaceFixtures.basic,
    members: [memberFixtures.owner, memberFixtures.editor],
    currentUserRole: 'EDITOR',
  },
  asViewer: {
    ...workspaceFixtures.basic,
    members: [memberFixtures.owner, memberFixtures.viewer],
    currentUserRole: 'VIEWER',
  },
};

/**
 * Workspace file fixtures
 */
export const workspaceFileFixtures: Record<string, WorkspaceFile> = {
  basic: {
    id: 'ws-file-001',
    name: 'workspace-document.pdf',
    size: 1024000,
    mimeType: 'application/pdf',
    folderId: null,
    extension: 'pdf',
    workspaceId: 'workspace-basic-001',
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
  },
  inFolder: {
    id: 'ws-file-002',
    name: 'project-notes.md',
    size: 2048,
    mimeType: 'text/markdown',
    folderId: 'ws-folder-001',
    extension: 'md',
    workspaceId: 'workspace-basic-001',
    createdAt: '2024-01-13T14:00:00Z',
    updatedAt: '2024-01-14T09:00:00Z',
    isStarred: true,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
  },
};

/**
 * Workspace folder fixtures
 */
export const workspaceFolderFixtures: Record<string, WorkspaceFolder> = {
  basic: {
    id: 'ws-folder-001',
    name: 'Projects',
    parentId: null,
    description: 'Project files',
    color: '#3498DB',
    workspaceId: 'workspace-basic-001',
    createdAt: '2024-01-11T09:00:00Z',
    updatedAt: '2024-01-11T09:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    fileCount: 5,
    folderCount: 2,
    totalSize: 5242880,
  },
  nested: {
    id: 'ws-folder-002',
    name: 'Drafts',
    parentId: 'ws-folder-001',
    description: 'Draft documents',
    color: null,
    workspaceId: 'workspace-basic-001',
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    fileCount: 2,
    folderCount: 0,
    totalSize: 1048576,
  },
};

/**
 * Workspace list response fixtures
 */
export const workspaceListFixtures: Record<string, WorkspaceListResponse> = {
  empty: {
    owned: [],
    member: [],
  },
  ownedOnly: {
    owned: [workspaceFixtures.basic, workspaceFixtures.minimal],
    member: [],
  },
  memberOnly: {
    owned: [],
    member: [workspaceFixtures.large],
  },
  mixed: {
    owned: [workspaceFixtures.basic],
    member: [workspaceFixtures.large, workspaceFixtures.nearFull],
  },
};

/**
 * Create a list of workspaces for testing
 */
export function createWorkspaceList(
  count: number,
  overrides: Partial<Workspace> = {}
): Workspace[] {
  return Array.from({ length: count }, (_, i) => ({
    ...workspaceFixtures.basic,
    id: `workspace-list-${String(i + 1).padStart(3, '0')}`,
    name: `Workspace ${i + 1}`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    ...overrides,
  }));
}
