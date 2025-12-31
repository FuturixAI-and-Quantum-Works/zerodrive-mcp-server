/**
 * Application constants
 */

/**
 * Server information
 */
export const SERVER_NAME = 'zerodrive-mcp-server';
export const SERVER_VERSION = '2.0.0';

/**
 * API configuration
 */
export const API_VERSION = 'v1';
export const API_BASE_PATH = `/api/${API_VERSION}`;

/**
 * HTTP methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  LIMIT: 50,
  MAX_LIMIT: 100,
  OFFSET: 0,
} as const;

/**
 * Sort options
 */
export const SORT_FIELDS = {
  NAME: 'name',
  SIZE: 'size',
  CREATED_AT: 'createdAt',
  UPDATED_AT: 'updatedAt',
  MIME_TYPE: 'mimeType',
} as const;

export type SortField = (typeof SORT_FIELDS)[keyof typeof SORT_FIELDS];

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

/**
 * Share roles
 */
export const SHARE_ROLES = {
  VIEWER: 'viewer',
  EDITOR: 'editor',
} as const;

export type ShareRole = (typeof SHARE_ROLES)[keyof typeof SHARE_ROLES];

/**
 * Signed URL expiration options (in seconds)
 */
export const SIGNED_URL_EXPIRY = {
  MIN: 3600, // 1 hour
  MAX: 604800, // 7 days
  DEFAULT: 3600, // 1 hour
} as const;

/**
 * File upload limits
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_WORKSPACE_FILE_SIZE: 100 * 1024 * 1024, // 100MB
} as const;

/**
 * Workspace storage allocation
 */
export const WORKSPACE_STORAGE = {
  MIN_ALLOCATION: 100 * 1024 * 1024, // 100MB minimum
} as const;

/**
 * Resource types
 */
export const RESOURCE_TYPES = {
  FILE: 'file',
  FOLDER: 'folder',
} as const;

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];
