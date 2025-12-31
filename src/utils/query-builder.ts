/**
 * Query parameter builder utility
 * Extracts repeated query building pattern (~5+ handlers)
 */

import type { PaginationParams, SortParams } from '../types/entities.js';

/**
 * Fluent query parameter builder
 */
export class QueryBuilder {
  private params: URLSearchParams;

  constructor() {
    this.params = new URLSearchParams();
  }

  /**
   * Append a string value if defined and non-empty
   */
  appendIfDefined(key: string, value: string | undefined | null): this {
    if (value !== undefined && value !== null && value !== '') {
      this.params.append(key, value);
    }
    return this;
  }

  /**
   * Append a number value if defined
   */
  appendNumber(key: string, value: number | undefined | null): this {
    if (value !== undefined && value !== null) {
      this.params.append(key, String(value));
    }
    return this;
  }

  /**
   * Append a boolean value if defined
   * Converts to 'true' or 'false' string
   */
  appendBoolean(key: string, value: boolean | undefined): this {
    if (value !== undefined) {
      this.params.append(key, String(value));
    }
    return this;
  }

  /**
   * Append pagination parameters (limit, offset)
   */
  appendPagination(params: PaginationParams | undefined): this {
    if (params) {
      this.appendNumber('limit', params.limit);
      this.appendNumber('offset', params.offset);
    }
    return this;
  }

  /**
   * Append sort parameters (sortBy, sortOrder)
   */
  appendSort(params: SortParams | undefined): this {
    if (params) {
      this.appendIfDefined('sortBy', params.sortBy);
      this.appendIfDefined('sortOrder', params.sortOrder);
    }
    return this;
  }

  /**
   * Append file filter parameters
   */
  appendFileFilters(filters: {
    folderId?: string | null;
    includeSubfolders?: boolean;
    starred?: boolean;
    shared?: boolean;
    trashed?: boolean;
    search?: string;
  }): this {
    this.appendIfDefined('folderId', filters.folderId ?? undefined);
    this.appendBoolean('includeSubfolders', filters.includeSubfolders);
    this.appendBoolean('starred', filters.starred);
    this.appendBoolean('shared', filters.shared);
    this.appendBoolean('trashed', filters.trashed);
    this.appendIfDefined('search', filters.search);
    return this;
  }

  /**
   * Append folder filter parameters
   */
  appendFolderFilters(filters: {
    folderId?: string | null;
    parentId?: string | null;
    starred?: boolean;
    shared?: boolean;
    trashed?: boolean;
    search?: string;
  }): this {
    this.appendIfDefined('folderId', filters.folderId ?? undefined);
    this.appendIfDefined('parentId', filters.parentId ?? undefined);
    this.appendBoolean('starred', filters.starred);
    this.appendBoolean('shared', filters.shared);
    this.appendBoolean('trashed', filters.trashed);
    this.appendIfDefined('search', filters.search);
    return this;
  }

  /**
   * Append workspace filter parameters
   */
  appendWorkspaceFilters(filters: {
    folderId?: string | null;
    parentId?: string | null;
    starred?: boolean;
    trashed?: boolean;
    search?: string;
  }): this {
    this.appendIfDefined('folderId', filters.folderId ?? undefined);
    this.appendIfDefined('parentId', filters.parentId ?? undefined);
    this.appendBoolean('starred', filters.starred);
    this.appendBoolean('trashed', filters.trashed);
    this.appendIfDefined('search', filters.search);
    return this;
  }

  /**
   * Build the query string
   * @returns Query string without leading '?' or empty string if no params
   */
  build(): string {
    const queryString = this.params.toString();
    return queryString;
  }

  /**
   * Build the full query string with '?' prefix if params exist
   * @returns Query string with leading '?' or empty string if no params
   */
  buildWithPrefix(): string {
    const queryString = this.build();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Check if any parameters have been added
   */
  hasParams(): boolean {
    return this.params.toString().length > 0;
  }

  /**
   * Get the URLSearchParams instance
   */
  getParams(): URLSearchParams {
    return this.params;
  }

  /**
   * Create a new instance from an existing object
   */
  static from(params: Record<string, string | number | boolean | undefined | null>): QueryBuilder {
    const builder = new QueryBuilder();
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (typeof value === 'boolean') {
        builder.appendBoolean(key, value);
      } else if (typeof value === 'number') {
        builder.appendNumber(key, value);
      } else {
        builder.appendIfDefined(key, value);
      }
    }
    return builder;
  }
}

/**
 * Convenience function to build query string from args
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  return QueryBuilder.from(params).build();
}

/**
 * Convenience function to build query string with '?' prefix
 */
export function buildQueryStringWithPrefix(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  return QueryBuilder.from(params).buildWithPrefix();
}
