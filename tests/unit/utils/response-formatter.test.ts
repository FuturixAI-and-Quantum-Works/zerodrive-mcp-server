/**
 * Unit tests for response formatter utility
 */

import { describe, it, expect } from 'vitest';
import {
  formatSuccess,
  formatError,
  createSuccessResult,
  createErrorResult,
  createTextResult,
  createTextContent,
  withErrorHandling,
  formatList,
  formatOperationResult,
  formatBytes,
  formatDate,
} from '../../../src/utils/response-formatter.js';
import { ValidationError, NetworkError, ErrorCode, ZeroDriveError } from '../../../src/errors/base.js';

describe('formatSuccess', () => {
  it('should format object as JSON', () => {
    const result = formatSuccess({ id: '123', name: 'test' });

    expect(result).toBe(JSON.stringify({ id: '123', name: 'test' }, null, 2));
  });

  it('should format array as JSON', () => {
    const result = formatSuccess([1, 2, 3]);

    expect(result).toBe(JSON.stringify([1, 2, 3], null, 2));
  });

  it('should format primitive values', () => {
    expect(formatSuccess('hello')).toBe('"hello"');
    expect(formatSuccess(42)).toBe('42');
    expect(formatSuccess(true)).toBe('true');
    expect(formatSuccess(null)).toBe('null');
  });

  it('should handle nested objects', () => {
    const data = { user: { name: 'John', email: 'john@example.com' } };
    const result = formatSuccess(data);

    expect(JSON.parse(result)).toEqual(data);
  });
});

describe('formatError', () => {
  it('should format ZeroDriveError', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });
    const result = formatError(error);

    expect(result).toContain('Error: Invalid input');
    expect(result).toContain('Code: VALIDATION_ERROR');
    expect(result).toContain('Context:');
    expect(result).toContain('field');
  });

  it('should format regular Error', () => {
    const error = new Error('Something went wrong');
    const result = formatError(error);

    expect(result).toBe('Error: Something went wrong');
  });

  it('should format string error', () => {
    const result = formatError('Connection failed');

    expect(result).toBe('Error: Connection failed');
  });

  it('should handle unknown error type', () => {
    const result = formatError(42);

    expect(result).toBe('Error: An unknown error occurred');
  });

  it('should handle null', () => {
    const result = formatError(null);

    expect(result).toBe('Error: An unknown error occurred');
  });

  it('should include error context when present', () => {
    const error = new ZeroDriveError('Test error', ErrorCode.INTERNAL_ERROR, 500, {
      resourceId: 'file-123',
      statusCode: 500,
    });
    const result = formatError(error);

    expect(result).toContain('resourceId');
    expect(result).toContain('file-123');
  });

  it('should exclude undefined context values', () => {
    const error = new ValidationError('Test', { field: 'name', expected: undefined });
    const result = formatError(error);

    expect(result).toContain('field');
    expect(result).not.toContain('expected');
  });
});

describe('createSuccessResult', () => {
  it('should create MCP tool result', () => {
    const result = createSuccessResult({ id: '123' });

    expect(result).toHaveProperty('content');
    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.content[0]).toHaveProperty('text');
    expect(result.isError).toBeUndefined();
  });

  it('should format data as JSON', () => {
    const result = createSuccessResult({ name: 'test' });

    expect(JSON.parse(result.content[0].text)).toEqual({ name: 'test' });
  });
});

describe('createErrorResult', () => {
  it('should create MCP error result', () => {
    const error = new ValidationError('Invalid input');
    const result = createErrorResult(error);

    expect(result).toHaveProperty('content');
    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toHaveProperty('type', 'text');
    expect(result.isError).toBe(true);
  });

  it('should include error message', () => {
    const error = new Error('Failed');
    const result = createErrorResult(error);

    expect(result.content[0].text).toContain('Failed');
  });
});

describe('createTextResult', () => {
  it('should create text result', () => {
    const result = createTextResult('Hello, World!');

    expect(result).toEqual({
      content: [{ type: 'text', text: 'Hello, World!' }],
    });
  });

  it('should preserve text exactly', () => {
    const text = 'Line 1\nLine 2\n\tIndented';
    const result = createTextResult(text);

    expect(result.content[0].text).toBe(text);
  });
});

describe('createTextContent', () => {
  it('should create text content block', () => {
    const result = createTextContent('Hello');

    expect(result).toEqual({ type: 'text', text: 'Hello' });
  });
});

describe('withErrorHandling', () => {
  it('should return success result on success', async () => {
    const result = await withErrorHandling(async () => ({ id: '123' }));

    expect(result.isError).toBeUndefined();
    expect(JSON.parse(result.content[0].text)).toEqual({ id: '123' });
  });

  it('should return error result on failure', async () => {
    const result = await withErrorHandling(async () => {
      throw new Error('Handler failed');
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Handler failed');
  });

  it('should handle ZeroDriveError', async () => {
    const result = await withErrorHandling(async () => {
      throw new NetworkError('Connection failed');
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Connection failed');
  });
});

describe('formatList', () => {
  it('should return message for empty list', () => {
    const result = formatList([]);

    expect(result).toBe('No items found.');
  });

  it('should format items with default formatter', () => {
    const items = [{ id: '1' }, { id: '2' }];
    const result = formatList(items);

    expect(result).toContain('"id": "1"');
    expect(result).toContain('"id": "2"');
  });

  it('should use custom formatter', () => {
    const items = [{ name: 'Alice' }, { name: 'Bob' }];
    const result = formatList(items, (item) => `User: ${item.name}`);

    expect(result).toBe('User: Alice\n\nUser: Bob');
  });

  it('should separate items with double newlines', () => {
    const items = ['a', 'b', 'c'];
    const result = formatList(items, (s) => s);

    expect(result).toBe('a\n\nb\n\nc');
  });
});

describe('formatOperationResult', () => {
  it('should format successful operation', () => {
    const result = formatOperationResult('File upload', true);

    expect(result).toBe('File upload successful');
  });

  it('should format failed operation', () => {
    const result = formatOperationResult('File upload', false);

    expect(result).toBe('File upload failed');
  });

  it('should include details when provided', () => {
    const result = formatOperationResult('File upload', true, {
      fileId: 'file-123',
      size: 1024,
    });

    expect(result).toContain('File upload successful');
    expect(result).toContain('Details:');
    expect(result).toContain('fileId');
    expect(result).toContain('file-123');
    expect(result).toContain('size');
    expect(result).toContain('1024');
  });

  it('should exclude undefined details', () => {
    const result = formatOperationResult('Operation', true, {
      id: '123',
      extra: undefined,
    });

    expect(result).toContain('id');
    expect(result).not.toContain('extra');
  });

  it('should handle empty details', () => {
    const result = formatOperationResult('Operation', true, {});

    expect(result).toBe('Operation successful');
  });
});

describe('formatBytes', () => {
  it('should format bytes', () => {
    expect(formatBytes(500)).toBe('500.00 B');
  });

  it('should format kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1536)).toBe('1.50 KB');
  });

  it('should format megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });

  it('should format gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
  });

  it('should format terabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB');
  });

  it('should handle zero', () => {
    expect(formatBytes(0)).toBe('0.00 B');
  });

  it('should handle large numbers', () => {
    expect(formatBytes(100 * 1024 * 1024 * 1024)).toBe('100.00 GB');
  });
});

describe('formatDate', () => {
  it('should format Date object to ISO string', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDate(date);

    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should format ISO string input', () => {
    const dateString = '2024-01-15T10:30:00Z';
    const result = formatDate(dateString);

    expect(result).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should handle various date string formats', () => {
    expect(formatDate('2024-01-15')).toMatch(/2024-01-15T/);
  });
});
