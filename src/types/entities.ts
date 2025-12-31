/**
 * Domain entity types for ZeroDrive
 */

import type { ShareRole, SortField, SortOrder } from '../config/constants.js';

/**
 * Base entity properties shared by files and folders
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string;
  /** Entity name */
  name: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Whether the entity is starred */
  isStarred: boolean;
  /** Whether the entity is in trash */
  isTrashed: boolean;
  /** Timestamp when moved to trash */
  trashedAt?: string | null;
  /** Owner user ID */
  ownerId: string;
}

/**
 * File entity
 */
export interface ZeroDriveFile extends BaseEntity {
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** Parent folder ID (null for root) */
  folderId: string | null;
  /** File extension */
  extension?: string;
  /** Whether file is shared */
  isShared: boolean;
  /** Original filename */
  originalName?: string;
  /** Storage path/key */
  storageKey?: string;
  /** Checksum for integrity */
  checksum?: string;
}

/**
 * File metadata returned from get operations
 */
export interface FileMetadata extends ZeroDriveFile {
  /** Download URL (when available) */
  downloadUrl?: string;
  /** Signed URL (when generated) */
  signedUrl?: string;
  /** Signed URL expiration timestamp */
  signedUrlExpiresAt?: string;
  /** Share details */
  shares?: ShareInfo[];
}

/**
 * Folder entity
 */
export interface Folder extends BaseEntity {
  /** Parent folder ID (null for root) */
  parentId: string | null;
  /** Folder description */
  description?: string | null;
  /** Folder color (hex code) */
  color?: string | null;
  /** Whether folder is shared */
  isShared: boolean;
  /** Number of files in folder */
  fileCount?: number;
  /** Number of subfolders */
  folderCount?: number;
  /** Total size of folder contents */
  totalSize?: number;
}

/**
 * Folder with breadcrumb path
 */
export interface FolderWithPath extends Folder {
  /** Breadcrumb path from root */
  path: BreadcrumbItem[];
}

/**
 * Breadcrumb item for folder path
 */
export interface BreadcrumbItem {
  /** Folder ID */
  id: string;
  /** Folder name */
  name: string;
}

/**
 * Workspace entity
 */
export interface Workspace {
  /** Unique identifier */
  id: string;
  /** Workspace name */
  name: string;
  /** Workspace description */
  description?: string | null;
  /** Icon name or emoji */
  icon?: string | null;
  /** Color (hex code) */
  color?: string | null;
  /** Storage allocation in bytes */
  storageAllocation: number;
  /** Used storage in bytes */
  storageUsed: number;
  /** Owner user ID */
  ownerId: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Workspace member
 */
export interface WorkspaceMember {
  /** User ID */
  userId: string;
  /** User email */
  email: string;
  /** User display name */
  displayName?: string;
  /** Member role */
  role: 'OWNER' | 'ADMIN' | 'EDITOR' | 'VIEWER';
  /** When member joined */
  joinedAt: string;
}

/**
 * Workspace with members
 */
export interface WorkspaceWithMembers extends Workspace {
  /** Workspace members */
  members: WorkspaceMember[];
  /** Current user's role */
  currentUserRole: WorkspaceMember['role'];
}

/**
 * Workspace file (file within a workspace)
 */
export interface WorkspaceFile extends ZeroDriveFile {
  /** Workspace ID */
  workspaceId: string;
}

/**
 * Workspace folder
 */
export interface WorkspaceFolder extends Folder {
  /** Workspace ID */
  workspaceId: string;
}

/**
 * Share information
 */
export interface ShareInfo {
  /** Share ID */
  id: string;
  /** Shared with email */
  email: string;
  /** Permission role */
  role: ShareRole;
  /** Whether recipient can re-share */
  canShare: boolean;
  /** Share creation timestamp */
  createdAt: string;
  /** Share message */
  message?: string | null;
}

/**
 * Trash item (file or folder in trash)
 */
export interface TrashItem {
  /** Item ID */
  id: string;
  /** Item name */
  name: string;
  /** Item type */
  type: 'file' | 'folder';
  /** Size (for files) */
  size?: number;
  /** MIME type (for files) */
  mimeType?: string;
  /** Original parent folder ID */
  originalParentId: string | null;
  /** When moved to trash */
  trashedAt: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Maximum items to return */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
}

/**
 * Sort parameters
 */
export interface SortParams {
  /** Field to sort by */
  sortBy?: SortField | string;
  /** Sort direction */
  sortOrder?: SortOrder;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Response items */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Total item count */
    total: number;
    /** Current page limit */
    limit: number;
    /** Current offset */
    offset: number;
    /** Whether more items exist */
    hasMore: boolean;
  };
}

/**
 * File list response
 */
export interface FileListResponse extends PaginatedResponse<ZeroDriveFile> {}

/**
 * Folder list response
 */
export interface FolderListResponse extends PaginatedResponse<Folder> {}

/**
 * Workspace list response
 */
export interface WorkspaceListResponse {
  /** Workspaces owned by user */
  owned: Workspace[];
  /** Workspaces user is member of */
  member: Workspace[];
}

/**
 * Trash list response
 */
export interface TrashListResponse extends PaginatedResponse<TrashItem> {}

/**
 * Upload result
 */
export interface UploadResult {
  /** Uploaded file metadata */
  file: ZeroDriveFile;
  /** Success message */
  message?: string;
}

/**
 * Share result
 */
export interface ShareResult {
  /** Share IDs created */
  shareIds: string[];
  /** Emails shared with */
  sharedWith: string[];
  /** Success message */
  message?: string;
}

/**
 * Signed URL result
 */
export interface SignedUrlResult {
  /** The signed URL */
  url: string;
  /** Expiration timestamp */
  expiresAt: string;
}
