/**
 * Custom error classes for ZeroDrive MCP Server
 */

/**
 * Error codes for categorization
 */
export const ErrorCode = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Authentication errors (401)
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  INVALID_API_KEY: 'INVALID_API_KEY',
  MISSING_API_KEY: 'MISSING_API_KEY',

  // Authorization errors (403)
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INSUFFICIENT_ROLE: 'INSUFFICIENT_ROLE',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FOLDER_NOT_FOUND: 'FOLDER_NOT_FOUND',
  WORKSPACE_NOT_FOUND: 'WORKSPACE_NOT_FOUND',

  // Conflict errors (409)
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Rate limit errors (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  API_ERROR: 'API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',

  // Configuration errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',

  // File operation errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

/**
 * Error context for additional information
 */
export interface ErrorContext {
  /** Resource ID (file, folder, workspace) */
  resourceId?: string;
  /** Resource type */
  resourceType?: string;
  /** Field that caused the error */
  field?: string;
  /** Expected value */
  expected?: unknown;
  /** Actual value */
  actual?: unknown;
  /** HTTP status code from API */
  statusCode?: number;
  /** Original error message from API */
  apiMessage?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Base error class for all ZeroDrive errors
 */
export class ZeroDriveError extends Error {
  /** Error code for categorization */
  readonly code: ErrorCodeType;

  /** HTTP-like status code */
  readonly statusCode: number;

  /** Additional error context */
  readonly context: ErrorContext;

  /** Whether this error is retryable */
  readonly retryable: boolean;

  constructor(
    message: string,
    code: ErrorCodeType,
    statusCode: number = 500,
    context: ErrorContext = {},
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'ZeroDriveError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    this.retryable = retryable;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON-serializable object
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      retryable: this.retryable,
    };
  }
}

/**
 * Validation error for invalid input
 */
export class ValidationError extends ZeroDriveError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, context, false);
    this.name = 'ValidationError';
  }
}

/**
 * Error for missing required fields
 */
export class MissingRequiredFieldError extends ZeroDriveError {
  constructor(fieldName: string, context: ErrorContext = {}) {
    super(
      `Missing required field: ${fieldName}`,
      ErrorCode.MISSING_REQUIRED_FIELD,
      400,
      { field: fieldName, ...context },
      false
    );
    this.name = 'MissingRequiredFieldError';
  }
}

/**
 * Authentication error for invalid or missing credentials
 */
export class AuthenticationError extends ZeroDriveError {
  constructor(message: string = 'Authentication failed', context: ErrorContext = {}) {
    super(message, ErrorCode.AUTHENTICATION_ERROR, 401, context, false);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error for permission issues
 */
export class AuthorizationError extends ZeroDriveError {
  constructor(message: string = 'Permission denied', context: ErrorContext = {}) {
    super(message, ErrorCode.AUTHORIZATION_ERROR, 403, context, false);
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends ZeroDriveError {
  constructor(resourceType: string, resourceId?: string, context: ErrorContext = {}) {
    const message = resourceId
      ? `${resourceType} not found: ${resourceId}`
      : `${resourceType} not found`;
    super(message, ErrorCode.NOT_FOUND, 404, { resourceType, resourceId, ...context }, false);
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error for duplicate resources or state conflicts
 */
export class ConflictError extends ZeroDriveError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.CONFLICT, 409, context, false);
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error
 */
export class RateLimitError extends ZeroDriveError {
  /** Seconds to wait before retry */
  readonly retryAfter?: number;

  constructor(retryAfter?: number, context: ErrorContext = {}) {
    const message = retryAfter
      ? `Rate limit exceeded. Retry after ${retryAfter} seconds`
      : 'Rate limit exceeded';
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, context, true);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * API error for upstream API failures
 */
export class ApiError extends ZeroDriveError {
  constructor(message: string, statusCode: number = 500, context: ErrorContext = {}) {
    const retryable = statusCode >= 500 || statusCode === 429;
    super(message, ErrorCode.API_ERROR, statusCode, context, retryable);
    this.name = 'ApiError';
  }
}

/**
 * Network error for connectivity issues
 */
export class NetworkError extends ZeroDriveError {
  constructor(message: string = 'Network request failed', context: ErrorContext = {}) {
    super(message, ErrorCode.NETWORK_ERROR, 503, context, true);
    this.name = 'NetworkError';
  }
}

/**
 * Configuration error for invalid configuration
 */
export class ConfigurationError extends ZeroDriveError {
  constructor(message: string, context: ErrorContext = {}) {
    super(message, ErrorCode.CONFIGURATION_ERROR, 500, context, false);
    this.name = 'ConfigurationError';
  }
}

/**
 * File operation error
 */
export class FileOperationError extends ZeroDriveError {
  constructor(
    message: string,
    code: ErrorCodeType = ErrorCode.INTERNAL_ERROR,
    context: ErrorContext = {}
  ) {
    super(message, code, 400, context, false);
    this.name = 'FileOperationError';
  }
}

/**
 * Check if an error is a ZeroDriveError
 */
export function isZeroDriveError(error: unknown): error is ZeroDriveError {
  return error instanceof ZeroDriveError;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (isZeroDriveError(error)) {
    return error.retryable;
  }
  return false;
}

/**
 * Wrap an unknown error in a ZeroDriveError
 */
export function wrapError(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): ZeroDriveError {
  if (isZeroDriveError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new ZeroDriveError(error.message || defaultMessage, ErrorCode.INTERNAL_ERROR, 500, {
      originalError: error.name,
    });
  }

  return new ZeroDriveError(
    typeof error === 'string' ? error : defaultMessage,
    ErrorCode.INTERNAL_ERROR,
    500
  );
}
