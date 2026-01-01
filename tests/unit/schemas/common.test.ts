/**
 * Unit tests for common schemas
 */

import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  nonEmptyString,
  idSchema,
  optionalIdSchema,
  emailSchema,
  emailArraySchema,
  hexColorSchema,
  paginationSchema,
  fileSortSchema,
  folderSortSchema,
  trashSortSchema,
  shareRoleSchema,
  shareOptionsSchema,
  fileFiltersSchema,
  folderFiltersSchema,
  workspaceFiltersSchema,
  booleanCoerce,
  numberCoerce,
  parseArgs,
  safeParseArgs,
} from '../../../src/schemas/common.js';

describe('Basic Schemas', () => {
  describe('nonEmptyString', () => {
    it('should accept non-empty strings', () => {
      expect(nonEmptyString.parse('hello')).toBe('hello');
      expect(nonEmptyString.parse('a')).toBe('a');
      expect(nonEmptyString.parse('  spaces  ')).toBe('  spaces  ');
    });

    it('should reject empty strings', () => {
      expect(() => nonEmptyString.parse('')).toThrow(ZodError);
    });

    it('should reject non-strings', () => {
      expect(() => nonEmptyString.parse(123)).toThrow(ZodError);
      expect(() => nonEmptyString.parse(null)).toThrow(ZodError);
      expect(() => nonEmptyString.parse(undefined)).toThrow(ZodError);
    });
  });

  describe('idSchema', () => {
    it('should accept valid IDs', () => {
      expect(idSchema.parse('file-123')).toBe('file-123');
      expect(idSchema.parse('a')).toBe('a');
      expect(idSchema.parse('123')).toBe('123');
    });

    it('should reject empty strings', () => {
      expect(() => idSchema.parse('')).toThrow(ZodError);
      try {
        idSchema.parse('');
      } catch (error) {
        expect(error).toBeInstanceOf(ZodError);
        const zodError = error as ZodError;
        expect(zodError.issues[0].message).toBe('ID is required');
      }
    });
  });

  describe('optionalIdSchema', () => {
    it('should accept valid IDs', () => {
      expect(optionalIdSchema.parse('file-123')).toBe('file-123');
    });

    it('should accept null', () => {
      expect(optionalIdSchema.parse(null)).toBe(null);
    });

    it('should accept undefined', () => {
      expect(optionalIdSchema.parse(undefined)).toBe(undefined);
    });
  });

  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      expect(emailSchema.parse('user@example.com')).toBe('user@example.com');
      expect(emailSchema.parse('test.user@domain.co.uk')).toBe('test.user@domain.co.uk');
    });

    it('should reject invalid emails', () => {
      expect(() => emailSchema.parse('notanemail')).toThrow(ZodError);
      expect(() => emailSchema.parse('missing@')).toThrow(ZodError);
      expect(() => emailSchema.parse('@nodomain.com')).toThrow(ZodError);
    });
  });

  describe('emailArraySchema', () => {
    it('should accept array with one email', () => {
      expect(emailArraySchema.parse(['user@example.com'])).toEqual(['user@example.com']);
    });

    it('should accept array with multiple emails', () => {
      const emails = ['user1@example.com', 'user2@example.com'];
      expect(emailArraySchema.parse(emails)).toEqual(emails);
    });

    it('should reject empty array', () => {
      expect(() => emailArraySchema.parse([])).toThrow(ZodError);
    });

    it('should reject array with invalid email', () => {
      expect(() => emailArraySchema.parse(['valid@email.com', 'invalid'])).toThrow(ZodError);
    });
  });

  describe('hexColorSchema', () => {
    it('should accept valid hex colors', () => {
      expect(hexColorSchema.parse('#FF5733')).toBe('#FF5733');
      expect(hexColorSchema.parse('#000000')).toBe('#000000');
      expect(hexColorSchema.parse('#ffffff')).toBe('#ffffff');
      expect(hexColorSchema.parse('#AbCdEf')).toBe('#AbCdEf');
    });

    it('should reject invalid hex colors', () => {
      expect(() => hexColorSchema.parse('FF5733')).toThrow(ZodError); // Missing #
      expect(() => hexColorSchema.parse('#FFF')).toThrow(ZodError); // Short form
      expect(() => hexColorSchema.parse('#GGGGGG')).toThrow(ZodError); // Invalid chars
      expect(() => hexColorSchema.parse('#FF573')).toThrow(ZodError); // Too short
    });

    it('should accept undefined (optional)', () => {
      expect(hexColorSchema.parse(undefined)).toBe(undefined);
    });
  });
});

describe('Pagination Schema', () => {
  it('should apply defaults', () => {
    const result = paginationSchema.parse({});

    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it('should accept valid values', () => {
    const result = paginationSchema.parse({ limit: 25, offset: 100 });

    expect(result.limit).toBe(25);
    expect(result.offset).toBe(100);
  });

  it('should reject limit below 1', () => {
    expect(() => paginationSchema.parse({ limit: 0 })).toThrow(ZodError);
  });

  it('should reject limit above 100', () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow(ZodError);
  });

  it('should reject negative offset', () => {
    expect(() => paginationSchema.parse({ offset: -1 })).toThrow(ZodError);
  });

  it('should accept boundary values', () => {
    expect(paginationSchema.parse({ limit: 1 }).limit).toBe(1);
    expect(paginationSchema.parse({ limit: 100 }).limit).toBe(100);
    expect(paginationSchema.parse({ offset: 0 }).offset).toBe(0);
  });

  it('should reject non-integers', () => {
    expect(() => paginationSchema.parse({ limit: 10.5 })).toThrow(ZodError);
    expect(() => paginationSchema.parse({ offset: 5.5 })).toThrow(ZodError);
  });
});

describe('Sort Schemas', () => {
  describe('fileSortSchema', () => {
    it('should accept valid sortBy values', () => {
      const fields = ['name', 'size', 'createdAt', 'updatedAt', 'mimeType'];
      for (const field of fields) {
        expect(fileSortSchema.parse({ sortBy: field }).sortBy).toBe(field);
      }
    });

    it('should apply default sortOrder', () => {
      expect(fileSortSchema.parse({}).sortOrder).toBe('asc');
    });

    it('should accept valid sortOrder values', () => {
      expect(fileSortSchema.parse({ sortOrder: 'asc' }).sortOrder).toBe('asc');
      expect(fileSortSchema.parse({ sortOrder: 'desc' }).sortOrder).toBe('desc');
    });

    it('should reject invalid sortBy', () => {
      expect(() => fileSortSchema.parse({ sortBy: 'invalid' })).toThrow(ZodError);
    });

    it('should reject invalid sortOrder', () => {
      expect(() => fileSortSchema.parse({ sortOrder: 'random' })).toThrow(ZodError);
    });
  });

  describe('folderSortSchema', () => {
    it('should accept valid sortBy values', () => {
      const fields = ['name', 'createdAt', 'updatedAt'];
      for (const field of fields) {
        expect(folderSortSchema.parse({ sortBy: field }).sortBy).toBe(field);
      }
    });

    it('should reject file-only sort fields', () => {
      expect(() => folderSortSchema.parse({ sortBy: 'size' })).toThrow(ZodError);
      expect(() => folderSortSchema.parse({ sortBy: 'mimeType' })).toThrow(ZodError);
    });
  });

  describe('trashSortSchema', () => {
    it('should accept valid sortBy values', () => {
      const fields = ['name', 'size', 'trashedAt', 'updatedAt', 'createdAt'];
      for (const field of fields) {
        expect(trashSortSchema.parse({ sortBy: field }).sortBy).toBe(field);
      }
    });

    it('should accept trashedAt as sort field', () => {
      expect(trashSortSchema.parse({ sortBy: 'trashedAt' }).sortBy).toBe('trashedAt');
    });
  });
});

describe('Share Schemas', () => {
  describe('shareRoleSchema', () => {
    it('should accept viewer role', () => {
      expect(shareRoleSchema.parse('viewer')).toBe('viewer');
    });

    it('should accept editor role', () => {
      expect(shareRoleSchema.parse('editor')).toBe('editor');
    });

    it('should apply default viewer role', () => {
      expect(shareRoleSchema.parse(undefined)).toBe('viewer');
    });

    it('should reject invalid role', () => {
      expect(() => shareRoleSchema.parse('admin')).toThrow(ZodError);
    });
  });

  describe('shareOptionsSchema', () => {
    it('should apply defaults', () => {
      const result = shareOptionsSchema.parse({});

      expect(result.role).toBe('viewer');
      expect(result.canShare).toBe(false);
    });

    it('should accept all options', () => {
      const result = shareOptionsSchema.parse({
        role: 'editor',
        canShare: true,
        message: 'Please review this document',
      });

      expect(result.role).toBe('editor');
      expect(result.canShare).toBe(true);
      expect(result.message).toBe('Please review this document');
    });

    it('should reject message over 500 characters', () => {
      const longMessage = 'a'.repeat(501);
      expect(() => shareOptionsSchema.parse({ message: longMessage })).toThrow(ZodError);
    });

    it('should accept message at 500 characters', () => {
      const maxMessage = 'a'.repeat(500);
      expect(shareOptionsSchema.parse({ message: maxMessage }).message).toBe(maxMessage);
    });
  });
});

describe('Filter Schemas', () => {
  describe('fileFiltersSchema', () => {
    it('should accept all filter options', () => {
      const result = fileFiltersSchema.parse({
        folderId: 'folder-123',
        includeSubfolders: true,
        starred: true,
        shared: false,
        trashed: false,
        search: 'document',
      });

      expect(result.folderId).toBe('folder-123');
      expect(result.includeSubfolders).toBe(true);
      expect(result.starred).toBe(true);
      expect(result.shared).toBe(false);
      expect(result.trashed).toBe(false);
      expect(result.search).toBe('document');
    });

    it('should accept empty filters', () => {
      const result = fileFiltersSchema.parse({});

      expect(result).toEqual({});
    });

    it('should accept null folderId', () => {
      const result = fileFiltersSchema.parse({ folderId: null });

      expect(result.folderId).toBe(null);
    });
  });

  describe('folderFiltersSchema', () => {
    it('should accept folder filter options', () => {
      const result = folderFiltersSchema.parse({
        folderId: 'folder-123',
        starred: true,
        shared: true,
        trashed: false,
        search: 'docs',
      });

      expect(result.folderId).toBe('folder-123');
      expect(result.starred).toBe(true);
      expect(result.shared).toBe(true);
    });

    it('should not include includeSubfolders', () => {
      const result = folderFiltersSchema.parse({ includeSubfolders: true });

      expect(result).not.toHaveProperty('includeSubfolders');
    });
  });

  describe('workspaceFiltersSchema', () => {
    it('should accept workspace filter options', () => {
      const result = workspaceFiltersSchema.parse({
        folderId: 'folder-123',
        parentId: 'parent-456',
        starred: true,
        trashed: false,
        search: 'project',
      });

      expect(result.folderId).toBe('folder-123');
      expect(result.parentId).toBe('parent-456');
      expect(result.starred).toBe(true);
    });

    it('should not include shared filter', () => {
      const result = workspaceFiltersSchema.parse({ shared: true });

      expect(result).not.toHaveProperty('shared');
    });
  });
});

describe('Coercion Helpers', () => {
  describe('booleanCoerce', () => {
    it('should coerce "true" string to true', () => {
      expect(booleanCoerce.parse('true')).toBe(true);
      expect(booleanCoerce.parse('TRUE')).toBe(true);
      expect(booleanCoerce.parse('True')).toBe(true);
    });

    it('should coerce "false" string to false', () => {
      expect(booleanCoerce.parse('false')).toBe(false);
      expect(booleanCoerce.parse('FALSE')).toBe(false);
      expect(booleanCoerce.parse('False')).toBe(false);
    });

    it('should pass through boolean values', () => {
      expect(booleanCoerce.parse(true)).toBe(true);
      expect(booleanCoerce.parse(false)).toBe(false);
    });

    it('should accept undefined', () => {
      expect(booleanCoerce.parse(undefined)).toBe(undefined);
    });

    it('should reject non-boolean strings', () => {
      expect(() => booleanCoerce.parse('yes')).toThrow(ZodError);
      expect(() => booleanCoerce.parse('1')).toThrow(ZodError);
    });
  });

  describe('numberCoerce', () => {
    it('should coerce string to number', () => {
      expect(numberCoerce.parse('123')).toBe(123);
      expect(numberCoerce.parse('0')).toBe(0);
      expect(numberCoerce.parse('-10')).toBe(-10);
    });

    it('should pass through number values', () => {
      expect(numberCoerce.parse(42)).toBe(42);
    });

    it('should reject non-numeric strings', () => {
      expect(() => numberCoerce.parse('abc')).toThrow(ZodError);
      expect(() => numberCoerce.parse('')).toThrow(ZodError);
    });

    it('should reject floats for int schema', () => {
      expect(() => numberCoerce.parse(10.5)).toThrow(ZodError);
    });
  });
});

describe('Parse Utilities', () => {
  describe('parseArgs', () => {
    it('should parse valid args', () => {
      const result = parseArgs(paginationSchema, { limit: 25, offset: 10 });

      expect(result.limit).toBe(25);
      expect(result.offset).toBe(10);
    });

    it('should throw for invalid args', () => {
      expect(() => parseArgs(paginationSchema, { limit: 200 })).toThrow(ZodError);
    });

    it('should apply defaults', () => {
      const result = parseArgs(paginationSchema, {});

      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
    });
  });

  describe('safeParseArgs', () => {
    it('should return success for valid args', () => {
      const result = safeParseArgs(paginationSchema, { limit: 25, offset: 10 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(25);
        expect(result.data.offset).toBe(10);
      }
    });

    it('should return formatted error for invalid args', () => {
      const result = safeParseArgs(paginationSchema, { limit: 200 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('limit');
      }
    });

    it('should include path in error message', () => {
      const result = safeParseArgs(paginationSchema, { limit: 'invalid' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('limit');
      }
    });

    it('should join multiple errors', () => {
      const result = safeParseArgs(paginationSchema, { limit: -1, offset: -1 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain(';');
      }
    });
  });
});
