/**
 * Folder entity fixtures for testing
 */

import type { Folder, FolderWithPath, BreadcrumbItem } from '../../../src/types/entities.js';

/**
 * Basic folder fixtures
 */
export const folderFixtures: Record<string, Folder> = {
  basic: {
    id: 'folder-basic-001',
    name: 'Documents',
    parentId: null,
    description: 'Main documents folder',
    color: null,
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    fileCount: 10,
    folderCount: 3,
    totalSize: 5242880,
  },
  starred: {
    id: 'folder-starred-001',
    name: 'Important',
    parentId: null,
    description: 'Important files and documents',
    color: '#FF5733',
    createdAt: '2024-01-08T14:00:00Z',
    updatedAt: '2024-01-12T10:30:00Z',
    isStarred: true,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    fileCount: 5,
    folderCount: 1,
    totalSize: 2097152,
  },
  shared: {
    id: 'folder-shared-001',
    name: 'Team Projects',
    parentId: null,
    description: 'Shared team project folder',
    color: '#3498DB',
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-15T16:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: true,
    ownerId: 'user-123',
    fileCount: 25,
    folderCount: 5,
    totalSize: 52428800,
  },
  trashed: {
    id: 'folder-trashed-001',
    name: 'Old Archive',
    parentId: null,
    description: 'Archived files from 2023',
    color: null,
    createdAt: '2023-06-01T10:00:00Z',
    updatedAt: '2024-01-01T08:00:00Z',
    isStarred: false,
    isTrashed: true,
    trashedAt: '2024-01-01T08:00:00Z',
    isShared: false,
    ownerId: 'user-123',
    fileCount: 50,
    folderCount: 10,
    totalSize: 104857600,
  },
  nested: {
    id: 'folder-nested-001',
    name: 'Subfolders',
    parentId: 'folder-basic-001',
    description: 'Nested subfolder',
    color: '#2ECC71',
    createdAt: '2024-01-11T10:00:00Z',
    updatedAt: '2024-01-11T10:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    fileCount: 3,
    folderCount: 0,
    totalSize: 1048576,
  },
  empty: {
    id: 'folder-empty-001',
    name: 'Empty Folder',
    parentId: null,
    description: null,
    color: null,
    createdAt: '2024-01-14T12:00:00Z',
    updatedAt: '2024-01-14T12:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    fileCount: 0,
    folderCount: 0,
    totalSize: 0,
  },
  withColor: {
    id: 'folder-color-001',
    name: 'Personal',
    parentId: null,
    description: 'Personal files',
    color: '#9B59B6',
    createdAt: '2024-01-07T15:00:00Z',
    updatedAt: '2024-01-13T09:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    fileCount: 8,
    folderCount: 2,
    totalSize: 3145728,
  },
};

/**
 * Breadcrumb path fixtures
 */
export const breadcrumbFixtures: Record<string, BreadcrumbItem[]> = {
  root: [],
  singleLevel: [{ id: 'folder-basic-001', name: 'Documents' }],
  twoLevels: [
    { id: 'folder-basic-001', name: 'Documents' },
    { id: 'folder-nested-001', name: 'Subfolders' },
  ],
  threeLevels: [
    { id: 'folder-basic-001', name: 'Documents' },
    { id: 'folder-nested-001', name: 'Subfolders' },
    { id: 'folder-deep-001', name: 'Deep' },
  ],
};

/**
 * Folder with path fixtures
 */
export const folderWithPathFixtures: Record<string, FolderWithPath> = {
  rootFolder: {
    ...folderFixtures.basic,
    path: breadcrumbFixtures.root,
  },
  nestedFolder: {
    ...folderFixtures.nested,
    path: breadcrumbFixtures.singleLevel,
  },
  deepFolder: {
    id: 'folder-deep-001',
    name: 'Deep',
    parentId: 'folder-nested-001',
    description: 'Deep nested folder',
    color: null,
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
    fileCount: 1,
    folderCount: 0,
    totalSize: 512,
    path: breadcrumbFixtures.twoLevels,
  },
};

/**
 * Create a list of folders for pagination testing
 */
export function createFolderList(count: number, overrides: Partial<Folder> = {}): Folder[] {
  return Array.from({ length: count }, (_, i) => ({
    ...folderFixtures.basic,
    id: `folder-list-${String(i + 1).padStart(3, '0')}`,
    name: `Folder ${i + 1}`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    fileCount: Math.floor(Math.random() * 20),
    folderCount: Math.floor(Math.random() * 5),
    ...overrides,
  }));
}
