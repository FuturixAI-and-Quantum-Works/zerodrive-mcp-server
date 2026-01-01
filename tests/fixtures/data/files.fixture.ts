/**
 * File entity fixtures for testing
 */

import type {
  ZeroDriveFile,
  FileMetadata,
  UploadResult,
  SignedUrlResult,
} from '../../../src/types/entities.js';

/**
 * Basic file fixtures
 */
export const fileFixtures: Record<string, ZeroDriveFile> = {
  basic: {
    id: 'file-basic-001',
    name: 'document.pdf',
    size: 1024000,
    mimeType: 'application/pdf',
    folderId: null,
    extension: 'pdf',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
  },
  starred: {
    id: 'file-starred-001',
    name: 'important.docx',
    size: 512000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    folderId: null,
    extension: 'docx',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-12T14:20:00Z',
    isStarred: true,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
  },
  shared: {
    id: 'file-shared-001',
    name: 'presentation.pptx',
    size: 2048000,
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    folderId: 'folder-work-001',
    extension: 'pptx',
    createdAt: '2024-01-05T09:15:00Z',
    updatedAt: '2024-01-08T16:45:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: true,
    ownerId: 'user-123',
  },
  trashed: {
    id: 'file-trashed-001',
    name: 'old-report.xlsx',
    size: 256000,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    folderId: null,
    extension: 'xlsx',
    createdAt: '2023-12-01T11:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
    isStarred: false,
    isTrashed: true,
    trashedAt: '2024-01-01T10:00:00Z',
    isShared: false,
    ownerId: 'user-123',
  },
  inFolder: {
    id: 'file-in-folder-001',
    name: 'project-notes.md',
    size: 4096,
    mimeType: 'text/markdown',
    folderId: 'folder-projects-001',
    extension: 'md',
    createdAt: '2024-01-14T15:30:00Z',
    updatedAt: '2024-01-14T15:30:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
  },
  large: {
    id: 'file-large-001',
    name: 'video-recording.mp4',
    size: 100 * 1024 * 1024, // 100MB
    mimeType: 'video/mp4',
    folderId: null,
    extension: 'mp4',
    createdAt: '2024-01-13T20:00:00Z',
    updatedAt: '2024-01-13T20:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
  },
  textFile: {
    id: 'file-text-001',
    name: 'readme.txt',
    size: 1024,
    mimeType: 'text/plain',
    folderId: null,
    extension: 'txt',
    createdAt: '2024-01-12T12:00:00Z',
    updatedAt: '2024-01-12T12:00:00Z',
    isStarred: false,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
  },
  image: {
    id: 'file-image-001',
    name: 'photo.jpg',
    size: 5242880, // 5MB
    mimeType: 'image/jpeg',
    folderId: 'folder-photos-001',
    extension: 'jpg',
    createdAt: '2024-01-11T18:30:00Z',
    updatedAt: '2024-01-11T18:30:00Z',
    isStarred: true,
    isTrashed: false,
    isShared: false,
    ownerId: 'user-123',
  },
};

/**
 * File metadata fixtures (extended file info)
 */
export const fileMetadataFixtures: Record<string, FileMetadata> = {
  withDownloadUrl: {
    ...fileFixtures.basic,
    downloadUrl: 'https://storage.zerodrive.com/download/file-basic-001',
  },
  withSignedUrl: {
    ...fileFixtures.basic,
    signedUrl: 'https://storage.zerodrive.com/signed/file-basic-001?token=abc123',
    signedUrlExpiresAt: new Date(Date.now() + 3600000).toISOString(),
  },
  withShares: {
    ...fileFixtures.shared,
    shares: [
      {
        id: 'share-001',
        email: 'alice@example.com',
        role: 'editor',
        canShare: true,
        createdAt: '2024-01-06T10:00:00Z',
        message: 'Please review this presentation',
      },
      {
        id: 'share-002',
        email: 'bob@example.com',
        role: 'viewer',
        canShare: false,
        createdAt: '2024-01-07T14:00:00Z',
        message: null,
      },
    ],
  },
};

/**
 * Upload result fixtures
 */
export const uploadResultFixtures: Record<string, UploadResult> = {
  success: {
    file: fileFixtures.basic,
    message: 'File uploaded successfully',
  },
  successLarge: {
    file: fileFixtures.large,
    message: 'File uploaded successfully',
  },
};

/**
 * Signed URL result fixtures
 */
export const signedUrlFixtures: Record<string, SignedUrlResult> = {
  default: {
    url: 'https://storage.zerodrive.com/signed/file-basic-001?token=abc123&expires=3600',
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  },
  longExpiry: {
    url: 'https://storage.zerodrive.com/signed/file-basic-001?token=xyz789&expires=604800',
    expiresAt: new Date(Date.now() + 604800000).toISOString(),
  },
};

/**
 * Create a list of files for pagination testing
 */
export function createFileList(
  count: number,
  overrides: Partial<ZeroDriveFile> = {}
): ZeroDriveFile[] {
  return Array.from({ length: count }, (_, i) => ({
    ...fileFixtures.basic,
    id: `file-list-${String(i + 1).padStart(3, '0')}`,
    name: `file-${i + 1}.txt`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 86400000).toISOString(),
    ...overrides,
  }));
}
