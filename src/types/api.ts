/**
 * API request/response types
 */

import type { HttpMethod } from '../config/constants.js';

/**
 * API request options
 */
export interface ApiRequestOptions {
  /** HTTP method */
  method?: HttpMethod;
  /** Request body */
  body?: unknown;
  /** Additional headers */
  headers?: Record<string, string>;
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to skip automatic JSON parsing */
  rawResponse?: boolean;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  /** Response data */
  data: T;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Headers;
}

/**
 * API error response from ZeroDrive backend
 */
export interface ApiErrorResponse {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** Field-specific errors */
  errors?: Record<string, string[]>;
  /** HTTP status code */
  statusCode?: number;
}

/**
 * Upload request options
 */
export interface UploadOptions {
  /** Local file path */
  filePath: string;
  /** Target endpoint */
  endpoint: string;
  /** Additional form fields */
  formFields?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Upload progress event
 */
export interface UploadProgress {
  /** Bytes uploaded */
  loaded: number;
  /** Total bytes */
  total: number;
  /** Progress percentage (0-100) */
  percentage: number;
}

/**
 * Tool execution result (MCP format)
 */
export interface ToolResult {
  /** Result content */
  content: ToolResultContent[];
  /** Whether result is an error */
  isError?: boolean;
}

/**
 * Tool result content block
 */
export interface ToolResultContent {
  /** Content type */
  type: 'text' | 'image' | 'resource';
  /** Text content */
  text?: string;
  /** Image data */
  data?: string;
  /** MIME type for image */
  mimeType?: string;
}

/**
 * Request context for logging and tracing
 */
export interface RequestContext {
  /** Unique request ID */
  requestId: string;
  /** Tool being executed */
  tool?: string;
  /** Start timestamp */
  startTime: number;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  /** Base URL for API requests */
  baseUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Default timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts */
  maxRetries?: number;
  /** Retry delay in milliseconds */
  retryDelay?: number;
}
