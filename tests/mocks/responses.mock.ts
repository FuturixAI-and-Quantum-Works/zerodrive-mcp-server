/**
 * API response mock builders for testing
 */

import type {
  ZeroDriveFile,
  Folder,
  Workspace,
  TrashItem,
  PaginatedResponse,
  UploadResult,
  ShareResult,
  SignedUrlResult,
  WorkspaceListResponse,
} from '../../src/types/entities.js';
import { createMockFile, createMockFolder, createMockWorkspace } from './entities.mock.js';

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  overrides: Partial<PaginatedResponse<T>['pagination']> = {}
): PaginatedResponse<T> {
  const total = overrides.total ?? data.length;
  const limit = overrides.limit ?? 50;
  const offset = overrides.offset ?? 0;

  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
      ...overrides,
    },
  };
}

/**
 * Mock API response builders
 */
export const mockApiResponses = {
  // File responses
  fileList: (
    files: ZeroDriveFile[],
    pagination?: Partial<PaginatedResponse<ZeroDriveFile>['pagination']>
  ) => createPaginatedResponse(files, pagination),

  file: (overrides: Partial<ZeroDriveFile> = {}) => createMockFile(overrides),

  uploadSuccess: (file: Partial<ZeroDriveFile> = {}): UploadResult => ({
    file: createMockFile(file),
    message: 'File uploaded successfully',
  }),

  downloadUrl: (fileId: string) => ({
    url: `https://storage.zerodrive.com/download/${fileId}`,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  }),

  signedUrl: (fileId: string, expiresInHours: number = 1): SignedUrlResult => ({
    url: `https://storage.zerodrive.com/signed/${fileId}?token=abc123`,
    expiresAt: new Date(Date.now() + expiresInHours * 3600000).toISOString(),
  }),

  fileContent: (content: string) => content,

  // Folder responses
  folderList: (
    folders: Folder[],
    pagination?: Partial<PaginatedResponse<Folder>['pagination']>
  ) => createPaginatedResponse(folders, pagination),

  folder: (overrides: Partial<Folder> = {}) => createMockFolder(overrides),

  folderWithPath: (overrides: Partial<Folder> = {}) => ({
    ...createMockFolder(overrides),
    path: [
      { id: 'root', name: 'Root' },
      { id: overrides.id ?? 'folder-1', name: overrides.name ?? 'Test Folder' },
    ],
  }),

  // Workspace responses
  workspaceList: (owned: Workspace[] = [], member: Workspace[] = []): WorkspaceListResponse => ({
    owned,
    member,
  }),

  workspace: (overrides: Partial<Workspace> = {}) => createMockWorkspace(overrides),

  workspaceWithMembers: (overrides: Partial<Workspace> = {}) => ({
    ...createMockWorkspace(overrides),
    members: [
      {
        userId: 'user-123',
        email: 'owner@example.com',
        displayName: 'Owner',
        role: 'OWNER',
        joinedAt: new Date().toISOString(),
      },
    ],
    currentUserRole: 'OWNER',
  }),

  // Trash responses
  trashList: (
    items: TrashItem[],
    pagination?: Partial<PaginatedResponse<TrashItem>['pagination']>
  ) => createPaginatedResponse(items, pagination),

  restoreSuccess: (item: { id: string; type: 'file' | 'folder' }) => ({
    id: item.id,
    type: item.type,
    message: `${item.type === 'file' ? 'File' : 'Folder'} restored successfully`,
  }),

  emptyTrashSuccess: () => ({
    deletedCount: 10,
    message: 'Trash emptied successfully',
  }),

  // Share responses
  shareSuccess: (emails: string[]): ShareResult => ({
    shareIds: emails.map((_, i) => `share-${i}`),
    sharedWith: emails,
    message: 'Shared successfully',
  }),

  // Error responses
  notFound: (resourceType: string = 'Resource', resourceId?: string) => ({
    message: resourceId
      ? `${resourceType} not found: ${resourceId}`
      : `${resourceType} not found`,
    code: 'NOT_FOUND',
    statusCode: 404,
  }),

  unauthorized: () => ({
    message: 'Invalid or missing API key',
    code: 'AUTHENTICATION_ERROR',
    statusCode: 401,
  }),

  forbidden: () => ({
    message: 'Permission denied',
    code: 'AUTHORIZATION_ERROR',
    statusCode: 403,
  }),

  rateLimited: (retryAfter: number = 60) => ({
    message: `Rate limit exceeded. Retry after ${retryAfter} seconds`,
    code: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    retryAfter,
  }),

  validationError: (field: string, message: string) => ({
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    errors: { [field]: [message] },
    statusCode: 400,
  }),

  conflict: (message: string = 'Resource already exists') => ({
    message,
    code: 'CONFLICT',
    statusCode: 409,
  }),

  internalError: (message: string = 'Internal server error') => ({
    message,
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  }),

  networkError: () => new TypeError('fetch failed'),
};

/**
 * Response fixtures for common scenarios
 */
export const responseFixtures = {
  emptyList: createPaginatedResponse([]),

  fullPage: <T>(items: T[]) =>
    createPaginatedResponse(items, { total: 250, limit: 100, hasMore: true }),

  lastPage: <T>(items: T[]) =>
    createPaginatedResponse(items, { total: 250, limit: 100, offset: 200, hasMore: false }),

  exactLimit: <T>(items: T[]) =>
    createPaginatedResponse(items, { total: items.length, limit: items.length, hasMore: false }),
};
