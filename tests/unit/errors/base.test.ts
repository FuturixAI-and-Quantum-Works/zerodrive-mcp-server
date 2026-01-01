/**
 * Unit tests for error classes
 */

import { describe, it, expect } from 'vitest';
import {
  ErrorCode,
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
} from '../../../src/errors/base.js';

describe('Error Classes', () => {
  describe('ZeroDriveError', () => {
    it('should create error with all properties', () => {
      const error = new ZeroDriveError('Test error', ErrorCode.INTERNAL_ERROR, 500, { field: 'test' }, true);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ZeroDriveError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.context).toEqual({ field: 'test' });
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('ZeroDriveError');
    });

    it('should use default values', () => {
      const error = new ZeroDriveError('Test error', ErrorCode.INTERNAL_ERROR);

      expect(error.statusCode).toBe(500);
      expect(error.context).toEqual({});
      expect(error.retryable).toBe(false);
    });

    it('should have stack trace', () => {
      const error = new ZeroDriveError('Test error', ErrorCode.INTERNAL_ERROR);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ZeroDriveError');
    });

    it('should serialize to JSON', () => {
      const error = new ZeroDriveError('Test error', ErrorCode.INTERNAL_ERROR, 500, { field: 'test' }, true);
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'ZeroDriveError',
        message: 'Test error',
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: 500,
        context: { field: 'test' },
        retryable: true,
      });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(ZeroDriveError);
      expect(error.name).toBe('ValidationError');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
    });

    it('should include context', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('MissingRequiredFieldError', () => {
    it('should create missing field error with message', () => {
      const error = new MissingRequiredFieldError('username');

      expect(error).toBeInstanceOf(ZeroDriveError);
      expect(error.name).toBe('MissingRequiredFieldError');
      expect(error.message).toBe('Missing required field: username');
      expect(error.code).toBe(ErrorCode.MISSING_REQUIRED_FIELD);
      expect(error.statusCode).toBe(400);
      expect(error.context.field).toBe('username');
    });

    it('should merge additional context', () => {
      const error = new MissingRequiredFieldError('email', { resourceType: 'user' });

      expect(error.context).toEqual({ field: 'email', resourceType: 'user' });
    });
  });

  describe('AuthenticationError', () => {
    it('should create with default message', () => {
      const error = new AuthenticationError();

      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('Authentication failed');
      expect(error.code).toBe(ErrorCode.AUTHENTICATION_ERROR);
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
    });

    it('should create with custom message', () => {
      const error = new AuthenticationError('Invalid API key');

      expect(error.message).toBe('Invalid API key');
    });
  });

  describe('AuthorizationError', () => {
    it('should create with default message', () => {
      const error = new AuthorizationError();

      expect(error.name).toBe('AuthorizationError');
      expect(error.message).toBe('Permission denied');
      expect(error.code).toBe(ErrorCode.AUTHORIZATION_ERROR);
      expect(error.statusCode).toBe(403);
      expect(error.retryable).toBe(false);
    });

    it('should create with custom message', () => {
      const error = new AuthorizationError('Insufficient permissions');

      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('NotFoundError', () => {
    it('should create with resource type only', () => {
      const error = new NotFoundError('File');

      expect(error.name).toBe('NotFoundError');
      expect(error.message).toBe('File not found');
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.context.resourceType).toBe('File');
      expect(error.context.resourceId).toBeUndefined();
    });

    it('should create with resource type and ID', () => {
      const error = new NotFoundError('File', 'file-123');

      expect(error.message).toBe('File not found: file-123');
      expect(error.context.resourceType).toBe('File');
      expect(error.context.resourceId).toBe('file-123');
    });

    it('should merge additional context', () => {
      const error = new NotFoundError('Folder', 'folder-456', { path: '/documents' });

      expect(error.context).toEqual({
        resourceType: 'Folder',
        resourceId: 'folder-456',
        path: '/documents',
      });
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.name).toBe('ConflictError');
      expect(error.message).toBe('Resource already exists');
      expect(error.code).toBe(ErrorCode.CONFLICT);
      expect(error.statusCode).toBe(409);
      expect(error.retryable).toBe(false);
    });
  });

  describe('RateLimitError', () => {
    it('should create without retry-after', () => {
      const error = new RateLimitError();

      expect(error.name).toBe('RateLimitError');
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
      expect(error.retryAfter).toBeUndefined();
    });

    it('should create with retry-after', () => {
      const error = new RateLimitError(60);

      expect(error.message).toBe('Rate limit exceeded. Retry after 60 seconds');
      expect(error.retryAfter).toBe(60);
    });
  });

  describe('ApiError', () => {
    it('should create with default status code', () => {
      const error = new ApiError('API error');

      expect(error.name).toBe('ApiError');
      expect(error.code).toBe(ErrorCode.API_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(true);
    });

    it('should be retryable for 5xx errors', () => {
      const error500 = new ApiError('Server error', 500);
      const error502 = new ApiError('Bad gateway', 502);
      const error503 = new ApiError('Service unavailable', 503);

      expect(error500.retryable).toBe(true);
      expect(error502.retryable).toBe(true);
      expect(error503.retryable).toBe(true);
    });

    it('should be retryable for 429 errors', () => {
      const error = new ApiError('Too many requests', 429);

      expect(error.retryable).toBe(true);
    });

    it('should not be retryable for 4xx errors (except 429)', () => {
      const error400 = new ApiError('Bad request', 400);
      const error404 = new ApiError('Not found', 404);

      expect(error400.retryable).toBe(false);
      expect(error404.retryable).toBe(false);
    });
  });

  describe('NetworkError', () => {
    it('should create with default message', () => {
      const error = new NetworkError();

      expect(error.name).toBe('NetworkError');
      expect(error.message).toBe('Network request failed');
      expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
      expect(error.statusCode).toBe(503);
      expect(error.retryable).toBe(true);
    });

    it('should create with custom message', () => {
      const error = new NetworkError('Connection timeout');

      expect(error.message).toBe('Connection timeout');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Missing API key');

      expect(error.name).toBe('ConfigurationError');
      expect(error.message).toBe('Missing API key');
      expect(error.code).toBe(ErrorCode.CONFIGURATION_ERROR);
      expect(error.statusCode).toBe(500);
      expect(error.retryable).toBe(false);
    });
  });

  describe('FileOperationError', () => {
    it('should create with default code', () => {
      const error = new FileOperationError('File too large');

      expect(error.name).toBe('FileOperationError');
      expect(error.message).toBe('File too large');
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('should create with specific code', () => {
      const error = new FileOperationError('File exceeds limit', ErrorCode.FILE_TOO_LARGE, {
        maxSize: 100 * 1024 * 1024,
      });

      expect(error.code).toBe(ErrorCode.FILE_TOO_LARGE);
      expect(error.context.maxSize).toBe(100 * 1024 * 1024);
    });
  });
});

describe('Type Guards', () => {
  describe('isZeroDriveError', () => {
    it('should return true for ZeroDriveError instances', () => {
      const error = new ZeroDriveError('Test', ErrorCode.INTERNAL_ERROR);

      expect(isZeroDriveError(error)).toBe(true);
    });

    it('should return true for subclass instances', () => {
      expect(isZeroDriveError(new ValidationError('Test'))).toBe(true);
      expect(isZeroDriveError(new NotFoundError('File'))).toBe(true);
      expect(isZeroDriveError(new NetworkError())).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Test');

      expect(isZeroDriveError(error)).toBe(false);
    });

    it('should return false for non-errors', () => {
      expect(isZeroDriveError('error')).toBe(false);
      expect(isZeroDriveError(null)).toBe(false);
      expect(isZeroDriveError(undefined)).toBe(false);
      expect(isZeroDriveError({})).toBe(false);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable ZeroDriveErrors', () => {
      expect(isRetryableError(new NetworkError())).toBe(true);
      expect(isRetryableError(new RateLimitError())).toBe(true);
      expect(isRetryableError(new ApiError('Error', 500))).toBe(true);
    });

    it('should return false for non-retryable ZeroDriveErrors', () => {
      expect(isRetryableError(new ValidationError('Test'))).toBe(false);
      expect(isRetryableError(new AuthenticationError())).toBe(false);
      expect(isRetryableError(new NotFoundError('File'))).toBe(false);
    });

    it('should return false for non-ZeroDriveErrors', () => {
      expect(isRetryableError(new Error('Test'))).toBe(false);
      expect(isRetryableError('error')).toBe(false);
      expect(isRetryableError(null)).toBe(false);
    });
  });
});

describe('wrapError', () => {
  it('should return ZeroDriveError unchanged', () => {
    const original = new ValidationError('Test');
    const wrapped = wrapError(original);

    expect(wrapped).toBe(original);
  });

  it('should wrap regular Error', () => {
    const original = new Error('Original message');
    const wrapped = wrapError(original);

    expect(wrapped).toBeInstanceOf(ZeroDriveError);
    expect(wrapped.message).toBe('Original message');
    expect(wrapped.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(wrapped.context.originalError).toBe('Error');
  });

  it('should wrap Error with empty message using default', () => {
    const original = new Error('');
    const wrapped = wrapError(original, 'Default message');

    expect(wrapped.message).toBe('Default message');
  });

  it('should wrap string errors', () => {
    const wrapped = wrapError('Something went wrong');

    expect(wrapped).toBeInstanceOf(ZeroDriveError);
    expect(wrapped.message).toBe('Something went wrong');
  });

  it('should wrap unknown values with default message', () => {
    const wrapped = wrapError(42, 'Unknown error');

    expect(wrapped.message).toBe('Unknown error');
  });

  it('should wrap null with default message', () => {
    const wrapped = wrapError(null, 'Null error');

    expect(wrapped.message).toBe('Null error');
  });

  it('should use provided default message', () => {
    const wrapped = wrapError({}, 'Custom default');

    expect(wrapped.message).toBe('Custom default');
  });
});

describe('ErrorCode', () => {
  it('should have all expected codes', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.INVALID_ARGUMENT).toBe('INVALID_ARGUMENT');
    expect(ErrorCode.MISSING_REQUIRED_FIELD).toBe('MISSING_REQUIRED_FIELD');
    expect(ErrorCode.AUTHENTICATION_ERROR).toBe('AUTHENTICATION_ERROR');
    expect(ErrorCode.INVALID_API_KEY).toBe('INVALID_API_KEY');
    expect(ErrorCode.MISSING_API_KEY).toBe('MISSING_API_KEY');
    expect(ErrorCode.AUTHORIZATION_ERROR).toBe('AUTHORIZATION_ERROR');
    expect(ErrorCode.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.FILE_NOT_FOUND).toBe('FILE_NOT_FOUND');
    expect(ErrorCode.FOLDER_NOT_FOUND).toBe('FOLDER_NOT_FOUND');
    expect(ErrorCode.WORKSPACE_NOT_FOUND).toBe('WORKSPACE_NOT_FOUND');
    expect(ErrorCode.CONFLICT).toBe('CONFLICT');
    expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCode.API_ERROR).toBe('API_ERROR');
    expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorCode.CONFIGURATION_ERROR).toBe('CONFIGURATION_ERROR');
    expect(ErrorCode.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE');
    expect(ErrorCode.INVALID_FILE_TYPE).toBe('INVALID_FILE_TYPE');
    expect(ErrorCode.UPLOAD_FAILED).toBe('UPLOAD_FAILED');
  });
});
