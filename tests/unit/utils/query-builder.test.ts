/**
 * Unit tests for QueryBuilder utility
 */

import { describe, it, expect } from 'vitest';
import {
  QueryBuilder,
  buildQueryString,
  buildQueryStringWithPrefix,
} from '../../../src/utils/query-builder.js';

describe('QueryBuilder', () => {
  describe('appendIfDefined', () => {
    it('should append string value', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('name', 'test');

      expect(builder.build()).toBe('name=test');
    });

    it('should not append undefined', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('name', undefined);

      expect(builder.build()).toBe('');
    });

    it('should not append null', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('name', null);

      expect(builder.build()).toBe('');
    });

    it('should not append empty string', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('name', '');

      expect(builder.build()).toBe('');
    });

    it('should URL encode special characters', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('search', 'hello world');

      expect(builder.build()).toBe('search=hello+world');
    });

    it('should support chaining', () => {
      const result = new QueryBuilder()
        .appendIfDefined('a', 'one')
        .appendIfDefined('b', 'two')
        .build();

      expect(result).toBe('a=one&b=two');
    });
  });

  describe('appendNumber', () => {
    it('should append number value as string', () => {
      const builder = new QueryBuilder();
      builder.appendNumber('limit', 50);

      expect(builder.build()).toBe('limit=50');
    });

    it('should append zero', () => {
      const builder = new QueryBuilder();
      builder.appendNumber('offset', 0);

      expect(builder.build()).toBe('offset=0');
    });

    it('should not append undefined', () => {
      const builder = new QueryBuilder();
      builder.appendNumber('limit', undefined);

      expect(builder.build()).toBe('');
    });

    it('should not append null', () => {
      const builder = new QueryBuilder();
      builder.appendNumber('limit', null);

      expect(builder.build()).toBe('');
    });

    it('should handle negative numbers', () => {
      const builder = new QueryBuilder();
      builder.appendNumber('offset', -10);

      expect(builder.build()).toBe('offset=-10');
    });
  });

  describe('appendBoolean', () => {
    it('should append true as string', () => {
      const builder = new QueryBuilder();
      builder.appendBoolean('starred', true);

      expect(builder.build()).toBe('starred=true');
    });

    it('should append false as string', () => {
      const builder = new QueryBuilder();
      builder.appendBoolean('trashed', false);

      expect(builder.build()).toBe('trashed=false');
    });

    it('should not append undefined', () => {
      const builder = new QueryBuilder();
      builder.appendBoolean('starred', undefined);

      expect(builder.build()).toBe('');
    });
  });

  describe('appendPagination', () => {
    it('should append limit and offset', () => {
      const builder = new QueryBuilder();
      builder.appendPagination({ limit: 25, offset: 50 });

      expect(builder.build()).toContain('limit=25');
      expect(builder.build()).toContain('offset=50');
    });

    it('should handle partial pagination', () => {
      const builder = new QueryBuilder();
      builder.appendPagination({ limit: 25 });

      expect(builder.build()).toBe('limit=25');
    });

    it('should skip if undefined', () => {
      const builder = new QueryBuilder();
      builder.appendPagination(undefined);

      expect(builder.build()).toBe('');
    });
  });

  describe('appendSort', () => {
    it('should append sortBy and sortOrder', () => {
      const builder = new QueryBuilder();
      builder.appendSort({ sortBy: 'name', sortOrder: 'desc' });

      expect(builder.build()).toContain('sortBy=name');
      expect(builder.build()).toContain('sortOrder=desc');
    });

    it('should handle sortBy only', () => {
      const builder = new QueryBuilder();
      builder.appendSort({ sortBy: 'createdAt' });

      expect(builder.build()).toBe('sortBy=createdAt');
    });

    it('should skip if undefined', () => {
      const builder = new QueryBuilder();
      builder.appendSort(undefined);

      expect(builder.build()).toBe('');
    });
  });

  describe('appendFileFilters', () => {
    it('should append all file filters', () => {
      const builder = new QueryBuilder();
      builder.appendFileFilters({
        folderId: 'folder-123',
        includeSubfolders: true,
        starred: true,
        shared: false,
        trashed: false,
        search: 'document',
      });

      const result = builder.build();
      expect(result).toContain('folderId=folder-123');
      expect(result).toContain('includeSubfolders=true');
      expect(result).toContain('starred=true');
      expect(result).toContain('shared=false');
      expect(result).toContain('trashed=false');
      expect(result).toContain('search=document');
    });

    it('should omit null folderId', () => {
      const builder = new QueryBuilder();
      builder.appendFileFilters({ folderId: null });

      expect(builder.build()).toBe('');
    });

    it('should omit undefined filters', () => {
      const builder = new QueryBuilder();
      builder.appendFileFilters({ starred: true });

      expect(builder.build()).toBe('starred=true');
    });
  });

  describe('appendFolderFilters', () => {
    it('should append folder filters including parentId', () => {
      const builder = new QueryBuilder();
      builder.appendFolderFilters({
        folderId: 'folder-123',
        parentId: 'parent-456',
        starred: true,
        shared: false,
        trashed: false,
        search: 'project',
      });

      const result = builder.build();
      expect(result).toContain('folderId=folder-123');
      expect(result).toContain('parentId=parent-456');
      expect(result).toContain('starred=true');
    });

    it('should omit null parentId', () => {
      const builder = new QueryBuilder();
      builder.appendFolderFilters({ parentId: null });

      expect(builder.build()).toBe('');
    });
  });

  describe('appendWorkspaceFilters', () => {
    it('should append workspace filters', () => {
      const builder = new QueryBuilder();
      builder.appendWorkspaceFilters({
        folderId: 'folder-123',
        parentId: 'parent-456',
        starred: true,
        trashed: false,
        search: 'work',
      });

      const result = builder.build();
      expect(result).toContain('folderId=folder-123');
      expect(result).toContain('parentId=parent-456');
      expect(result).toContain('starred=true');
      expect(result).toContain('trashed=false');
      expect(result).toContain('search=work');
    });
  });

  describe('build', () => {
    it('should return empty string for no params', () => {
      const builder = new QueryBuilder();

      expect(builder.build()).toBe('');
    });

    it('should build multiple params', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('a', 'one');
      builder.appendIfDefined('b', 'two');
      builder.appendNumber('c', 3);

      expect(builder.build()).toBe('a=one&b=two&c=3');
    });
  });

  describe('buildWithPrefix', () => {
    it('should return query string with ? prefix', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('name', 'test');

      expect(builder.buildWithPrefix()).toBe('?name=test');
    });

    it('should return empty string for no params', () => {
      const builder = new QueryBuilder();

      expect(builder.buildWithPrefix()).toBe('');
    });
  });

  describe('hasParams', () => {
    it('should return false for empty builder', () => {
      const builder = new QueryBuilder();

      expect(builder.hasParams()).toBe(false);
    });

    it('should return true when params exist', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('name', 'test');

      expect(builder.hasParams()).toBe(true);
    });
  });

  describe('getParams', () => {
    it('should return URLSearchParams instance', () => {
      const builder = new QueryBuilder();
      builder.appendIfDefined('name', 'test');

      const params = builder.getParams();

      expect(params).toBeInstanceOf(URLSearchParams);
      expect(params.get('name')).toBe('test');
    });
  });

  describe('static from', () => {
    it('should create builder from object', () => {
      const builder = QueryBuilder.from({
        name: 'test',
        limit: 50,
        starred: true,
      });

      const result = builder.build();
      expect(result).toContain('name=test');
      expect(result).toContain('limit=50');
      expect(result).toContain('starred=true');
    });

    it('should skip undefined and null values', () => {
      const builder = QueryBuilder.from({
        name: 'test',
        limit: undefined,
        offset: null,
      });

      expect(builder.build()).toBe('name=test');
    });

    it('should handle empty object', () => {
      const builder = QueryBuilder.from({});

      expect(builder.build()).toBe('');
    });
  });
});

describe('buildQueryString', () => {
  it('should build query string from params object', () => {
    const result = buildQueryString({
      name: 'test',
      limit: 50,
      starred: true,
    });

    expect(result).toContain('name=test');
    expect(result).toContain('limit=50');
    expect(result).toContain('starred=true');
  });

  it('should return empty string for empty object', () => {
    expect(buildQueryString({})).toBe('');
  });

  it('should skip undefined and null values', () => {
    const result = buildQueryString({
      name: 'test',
      skip: undefined,
      also: null,
    });

    expect(result).toBe('name=test');
  });
});

describe('buildQueryStringWithPrefix', () => {
  it('should build query string with ? prefix', () => {
    const result = buildQueryStringWithPrefix({
      name: 'test',
    });

    expect(result).toBe('?name=test');
  });

  it('should return empty string for empty object', () => {
    expect(buildQueryStringWithPrefix({})).toBe('');
  });

  it('should handle multiple params', () => {
    const result = buildQueryStringWithPrefix({
      a: '1',
      b: '2',
    });

    expect(result).toMatch(/^\?/);
    expect(result).toContain('a=1');
    expect(result).toContain('b=2');
  });
});
