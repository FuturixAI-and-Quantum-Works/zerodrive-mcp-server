/**
 * API-specific error utilities
 */

import type { ApiErrorResponse } from '../types/api.js';
import {
  ZeroDriveError,
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  NetworkError,
  type ErrorContext,
} from './base.js';

/**
 * Transform API error response to typed error
 */
export function transformApiError(
  statusCode: number,
  errorBody: ApiErrorResponse | string,
  endpoint: string
): ZeroDriveError {
  const message =
    typeof errorBody === 'object' ? errorBody.message : errorBody || `HTTP ${statusCode}`;

  const context: ErrorContext = {
    endpoint,
    statusCode,
    ...(typeof errorBody === 'object' && errorBody.errors ? { errors: errorBody.errors } : {}),
  };

  switch (statusCode) {
    case 400:
      return new ValidationError(message, context);

    case 401:
      return new AuthenticationError(message, context);

    case 403:
      return new AuthorizationError(message, context);

    case 404:
      return new NotFoundError('Resource', undefined, context);

    case 429:
      return new RateLimitError(undefined, context);

    case 500:
    case 502:
    case 503:
    case 504:
      return new ApiError(message, statusCode, { ...context, retryable: true });

    default:
      return new ApiError(message, statusCode, context);
  }
}

/**
 * Check if an error should trigger a retry
 */
export function shouldRetry(error: unknown, attempt: number, maxAttempts: number): boolean {
  if (attempt >= maxAttempts) {
    return false;
  }

  if (error instanceof RateLimitError) {
    return true;
  }

  if (error instanceof ApiError) {
    // Retry server errors (5xx)
    return error.statusCode >= 500;
  }

  if (error instanceof NetworkError) {
    return true;
  }

  return false;
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  const delay = Math.min(exponentialDelay + jitter, maxDelay);
  return Math.floor(delay);
}

/**
 * Get retry-after value from error
 */
export function getRetryAfter(error: unknown): number | undefined {
  if (error instanceof RateLimitError) {
    return error.retryAfter;
  }
  return undefined;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  if (error instanceof ZeroDriveError) {
    return {
      name: error.name,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
      retryable: error.retryable,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    error: String(error),
  };
}

/**
 * Create error from fetch failure
 */
export function createFetchError(error: unknown): NetworkError {
  if (error instanceof TypeError) {
    if (error.message.includes('fetch')) {
      return new NetworkError('Network request failed - check your connection');
    }
    if (error.message.includes('abort')) {
      return new NetworkError('Request was aborted');
    }
  }

  if (error instanceof Error) {
    return new NetworkError(error.message);
  }

  return new NetworkError('Unknown network error');
}

/**
 * Check if error is due to authentication issues
 */
export function isAuthError(error: unknown): boolean {
  return (
    error instanceof AuthenticationError || (error instanceof ApiError && error.statusCode === 401)
  );
}

/**
 * Check if error is due to authorization/permission issues
 */
export function isPermissionError(error: unknown): boolean {
  return (
    error instanceof AuthorizationError || (error instanceof ApiError && error.statusCode === 403)
  );
}

/**
 * Check if error is a not found error
 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof NotFoundError || (error instanceof ApiError && error.statusCode === 404);
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return (
    error instanceof ValidationError || (error instanceof ApiError && error.statusCode === 400)
  );
}
