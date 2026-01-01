/**
 * Trash entity fixtures for testing
 */

import type { TrashItem, PaginatedResponse } from '../../../src/types/entities.js';

/**
 * Basic trash item fixtures
 */
export const trashFixtures: Record<string, TrashItem> = {
  file: {
    id: 'trash-file-001',
    name: 'deleted-document.pdf',
    type: 'file',
    size: 1024000,
    mimeType: 'application/pdf',
    originalParentId: 'folder-documents-001',
    trashedAt: '2024-01-14T10:00:00Z',
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-01-14T10:00:00Z',
  },
  folder: {
    id: 'trash-folder-001',
    name: 'deleted-folder',
    type: 'folder',
    size: undefined,
    mimeType: undefined,
    originalParentId: null,
    trashedAt: '2024-01-13T15:00:00Z',
    createdAt: '2023-12-15T10:00:00Z',
    updatedAt: '2024-01-13T15:00:00Z',
  },
  recentFile: {
    id: 'trash-file-002',
    name: 'recently-deleted.txt',
    type: 'file',
    size: 512,
    mimeType: 'text/plain',
    originalParentId: null,
    trashedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  oldFile: {
    id: 'trash-file-003',
    name: 'old-deleted.doc',
    type: 'file',
    size: 256000,
    mimeType: 'application/msword',
    originalParentId: 'folder-archive-001',
    trashedAt: '2023-12-01T12:00:00Z',
    createdAt: '2023-06-01T09:00:00Z',
    updatedAt: '2023-12-01T12:00:00Z',
  },
  imageFile: {
    id: 'trash-image-001',
    name: 'deleted-photo.jpg',
    type: 'file',
    size: 5242880,
    mimeType: 'image/jpeg',
    originalParentId: 'folder-photos-001',
    trashedAt: '2024-01-12T18:00:00Z',
    createdAt: '2024-01-05T14:00:00Z',
    updatedAt: '2024-01-12T18:00:00Z',
  },
  nestedFolder: {
    id: 'trash-folder-002',
    name: 'deleted-subfolder',
    type: 'folder',
    size: undefined,
    mimeType: undefined,
    originalParentId: 'folder-parent-001',
    trashedAt: '2024-01-11T09:00:00Z',
    createdAt: '2023-11-01T10:00:00Z',
    updatedAt: '2024-01-11T09:00:00Z',
  },
};

/**
 * Trash list response fixtures
 */
export const trashListFixtures = {
  empty: {
    data: [] as TrashItem[],
    pagination: {
      total: 0,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
  },
  singleFile: {
    data: [trashFixtures.file],
    pagination: {
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
  },
  singleFolder: {
    data: [trashFixtures.folder],
    pagination: {
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
  },
  mixed: {
    data: [trashFixtures.file, trashFixtures.folder, trashFixtures.recentFile],
    pagination: {
      total: 3,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
  },
  filesOnly: {
    data: [
      trashFixtures.file,
      trashFixtures.recentFile,
      trashFixtures.oldFile,
      trashFixtures.imageFile,
    ],
    pagination: {
      total: 4,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
  },
  foldersOnly: {
    data: [trashFixtures.folder, trashFixtures.nestedFolder],
    pagination: {
      total: 2,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
  },
};

/**
 * Restore result fixtures
 */
export const restoreResultFixtures = {
  file: {
    id: 'trash-file-001',
    type: 'file' as const,
    message: 'File restored successfully',
    restoredTo: 'folder-documents-001',
  },
  folder: {
    id: 'trash-folder-001',
    type: 'folder' as const,
    message: 'Folder restored successfully',
    restoredTo: null, // restored to root
  },
  fileToRoot: {
    id: 'trash-file-002',
    type: 'file' as const,
    message: 'File restored successfully',
    restoredTo: null,
  },
};

/**
 * Empty trash result fixtures
 */
export const emptyTrashResultFixtures = {
  success: {
    deletedCount: 10,
    message: 'Trash emptied successfully',
  },
  empty: {
    deletedCount: 0,
    message: 'Trash was already empty',
  },
  partial: {
    deletedCount: 5,
    message: 'Trash partially emptied',
    errors: ['Failed to delete item-001', 'Failed to delete item-002'],
  },
};

/**
 * Create a list of trash items for pagination testing
 */
export function createTrashList(count: number, type?: 'file' | 'folder'): TrashItem[] {
  return Array.from({ length: count }, (_, i) => {
    const itemType = type ?? (i % 2 === 0 ? 'file' : 'folder');
    const baseItem = itemType === 'file' ? trashFixtures.file : trashFixtures.folder;

    return {
      ...baseItem,
      id: `trash-item-${String(i + 1).padStart(3, '0')}`,
      name: `deleted-item-${i + 1}${itemType === 'file' ? '.txt' : ''}`,
      type: itemType,
      trashedAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    };
  });
}

/**
 * Create a paginated trash response
 */
export function createTrashListResponse(
  items: TrashItem[],
  overrides: Partial<PaginatedResponse<TrashItem>['pagination']> = {}
): PaginatedResponse<TrashItem> {
  const total = overrides.total ?? items.length;
  const limit = overrides.limit ?? 50;
  const offset = overrides.offset ?? 0;

  return {
    data: items,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
      ...overrides,
    },
  };
}
