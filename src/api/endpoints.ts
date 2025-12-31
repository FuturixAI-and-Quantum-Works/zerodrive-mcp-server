/**
 * API endpoint constants and URL builders
 */

import { API_BASE_PATH } from '../config/constants.js';

/**
 * File endpoints
 */
export const FILE_ENDPOINTS = {
  /** List files */
  LIST: `${API_BASE_PATH}/files`,
  /** Get file by ID */
  GET: (fileId: string) => `${API_BASE_PATH}/files/${fileId}`,
  /** Upload file */
  UPLOAD: `${API_BASE_PATH}/files/upload`,
  /** Download file */
  DOWNLOAD: (fileId: string) => `${API_BASE_PATH}/files/${fileId}/download`,
  /** Generate signed URL */
  SIGNED_URL: (fileId: string) => `${API_BASE_PATH}/files/${fileId}/signed-url`,
  /** Fetch file content */
  FETCH_CONTENT: (fileId: string) => `${API_BASE_PATH}/files/${fileId}/fetch`,
  /** Move file */
  MOVE: (fileId: string) => `${API_BASE_PATH}/files/${fileId}/move`,
  /** Share file */
  SHARE: (fileId: string) => `${API_BASE_PATH}/files/${fileId}/share`,
} as const;

/**
 * Folder endpoints
 */
export const FOLDER_ENDPOINTS = {
  /** List folders */
  LIST: `${API_BASE_PATH}/folders`,
  /** Create folder */
  CREATE: `${API_BASE_PATH}/folders`,
  /** Get folder by ID */
  GET: (folderId: string) => `${API_BASE_PATH}/folders/${folderId}`,
  /** Update folder */
  UPDATE: (folderId: string) => `${API_BASE_PATH}/folders/${folderId}`,
  /** Delete folder */
  DELETE: (folderId: string) => `${API_BASE_PATH}/folders/${folderId}`,
  /** Move folder */
  MOVE: (folderId: string) => `${API_BASE_PATH}/folders/${folderId}/move`,
  /** Share folder */
  SHARE: (folderId: string) => `${API_BASE_PATH}/folders/${folderId}/share`,
} as const;

/**
 * Workspace endpoints
 */
export const WORKSPACE_ENDPOINTS = {
  /** List workspaces */
  LIST: `${API_BASE_PATH}/workspaces`,
  /** Create workspace */
  CREATE: `${API_BASE_PATH}/workspaces`,
  /** Get workspace by ID */
  GET: (workspaceId: string) => `${API_BASE_PATH}/workspaces/${workspaceId}`,
  /** Upload file to workspace */
  UPLOAD_FILE: (workspaceId: string) => `${API_BASE_PATH}/workspaces/${workspaceId}/files/upload`,
  /** List workspace files */
  LIST_FILES: (workspaceId: string) => `${API_BASE_PATH}/workspaces/${workspaceId}/files`,
  /** List workspace folders */
  LIST_FOLDERS: (workspaceId: string) => `${API_BASE_PATH}/workspaces/${workspaceId}/folders`,
  /** Create workspace folder */
  CREATE_FOLDER: (workspaceId: string) => `${API_BASE_PATH}/workspaces/${workspaceId}/folders`,
  /** Get workspace folder */
  GET_FOLDER: (workspaceId: string, folderId: string) =>
    `${API_BASE_PATH}/workspaces/${workspaceId}/folders/${folderId}`,
  /** Update workspace folder */
  UPDATE_FOLDER: (workspaceId: string, folderId: string) =>
    `${API_BASE_PATH}/workspaces/${workspaceId}/folders/${folderId}`,
  /** Delete workspace folder */
  DELETE_FOLDER: (workspaceId: string, folderId: string) =>
    `${API_BASE_PATH}/workspaces/${workspaceId}/folders/${folderId}`,
} as const;

/**
 * Trash endpoints
 */
export const TRASH_ENDPOINTS = {
  /** List trash items */
  LIST: `${API_BASE_PATH}/trash`,
  /** Restore item from trash */
  RESTORE: (itemId: string) => `${API_BASE_PATH}/trash/${itemId}/restore`,
  /** Empty trash (uses DELETE on base trash endpoint) */
  EMPTY: `${API_BASE_PATH}/trash`,
} as const;

/**
 * All API endpoints
 */
export const ENDPOINTS = {
  files: FILE_ENDPOINTS,
  folders: FOLDER_ENDPOINTS,
  workspaces: WORKSPACE_ENDPOINTS,
  trash: TRASH_ENDPOINTS,
} as const;

/**
 * Build full URL with base and endpoint
 */
export function buildUrl(baseUrl: string, endpoint: string, query?: string): string {
  const url = `${baseUrl}${endpoint}`;
  return query ? `${url}?${query}` : url;
}

/**
 * Build endpoint with query parameters
 */
export function buildEndpointWithQuery(endpoint: string, query?: string): string {
  return query ? `${endpoint}?${query}` : endpoint;
}
