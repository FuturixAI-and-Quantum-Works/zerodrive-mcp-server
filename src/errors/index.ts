/**
 * Errors module exports
 */

export {
  ErrorCode,
  type ErrorCodeType,
  type ErrorContext,
  ZeroDriveError,
  ValidationError,
  MissingRequiredFieldError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ApiError,
  NetworkError,
  ConfigurationError,
  FileOperationError,
  isZeroDriveError,
  isRetryableError,
  wrapError,
} from './base.js';
