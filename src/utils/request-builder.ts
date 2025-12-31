/**
 * Request body builder utility
 * Extracts repeated request body construction pattern (~8+ handlers)
 */

import { MissingRequiredFieldError } from '../errors/base.js';

/**
 * Request body builder for constructing API request bodies
 */
export class RequestBodyBuilder {
  private body: Record<string, unknown>;

  constructor() {
    this.body = {};
  }

  /**
   * Set a required field
   * @throws MissingRequiredFieldError if value is undefined or null
   */
  setRequired(key: string, value: unknown): this {
    if (value === undefined || value === null) {
      throw new MissingRequiredFieldError(key);
    }
    this.body[key] = value;
    return this;
  }

  /**
   * Set an optional field only if value is defined
   */
  setOptional(key: string, value: unknown): this {
    if (value !== undefined) {
      this.body[key] = value;
    }
    return this;
  }

  /**
   * Set an optional field, allowing null values
   * Use this when null should be explicitly set (e.g., clearing a field)
   */
  setOptionalNullable(key: string, value: unknown): this {
    if (value !== undefined) {
      this.body[key] = value;
    }
    return this;
  }

  /**
   * Set a field with a default value if undefined
   */
  setWithDefault<T>(key: string, value: T | undefined, defaultValue: T): this {
    this.body[key] = value !== undefined ? value : defaultValue;
    return this;
  }

  /**
   * Set multiple required fields at once
   */
  setRequiredMany(fields: Record<string, unknown>): this {
    for (const [key, value] of Object.entries(fields)) {
      this.setRequired(key, value);
    }
    return this;
  }

  /**
   * Set multiple optional fields at once
   */
  setOptionalMany(fields: Record<string, unknown>): this {
    for (const [key, value] of Object.entries(fields)) {
      this.setOptional(key, value);
    }
    return this;
  }

  /**
   * Conditionally set a field
   */
  setIf(condition: boolean, key: string, value: unknown): this {
    if (condition) {
      this.body[key] = value;
    }
    return this;
  }

  /**
   * Build the request body
   */
  build(): Record<string, unknown> {
    return { ...this.body };
  }

  /**
   * Build and stringify the request body as JSON
   */
  buildJson(): string {
    return JSON.stringify(this.body);
  }

  /**
   * Check if body is empty
   */
  isEmpty(): boolean {
    return Object.keys(this.body).length === 0;
  }

  /**
   * Check if body has any fields
   */
  hasFields(): boolean {
    return Object.keys(this.body).length > 0;
  }

  /**
   * Create builder from existing object
   */
  static from(obj: Record<string, unknown>): RequestBodyBuilder {
    const builder = new RequestBodyBuilder();
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        builder.body[key] = value;
      }
    }
    return builder;
  }

  /**
   * Create builder for folder create/update operations
   */
  static forFolder(args: {
    name?: string;
    parentId?: string | null;
    description?: string | null;
    color?: string | null;
    isStarred?: boolean;
    action?: string;
    isTrashed?: boolean;
  }): RequestBodyBuilder {
    return new RequestBodyBuilder()
      .setOptional('name', args.name)
      .setOptionalNullable('parentId', args.parentId)
      .setOptionalNullable('description', args.description)
      .setOptionalNullable('color', args.color)
      .setOptional('isStarred', args.isStarred)
      .setOptional('action', args.action)
      .setOptional('isTrashed', args.isTrashed);
  }

  /**
   * Create builder for share operations
   */
  static forShare(args: {
    emails: string[];
    role?: string;
    canShare?: boolean;
    message?: string;
  }): RequestBodyBuilder {
    return new RequestBodyBuilder()
      .setRequired('emails', args.emails)
      .setOptional('role', args.role)
      .setOptional('canShare', args.canShare)
      .setOptional('message', args.message);
  }

  /**
   * Create builder for workspace create operations
   */
  static forWorkspaceCreate(args: {
    name: string;
    storageAllocation: number;
    description?: string;
    icon?: string;
    color?: string;
  }): RequestBodyBuilder {
    return new RequestBodyBuilder()
      .setRequired('name', args.name)
      .setRequired('storageAllocation', args.storageAllocation)
      .setOptional('description', args.description)
      .setOptional('icon', args.icon)
      .setOptional('color', args.color);
  }

  /**
   * Create builder for move operations
   */
  static forMove(targetId: string | null | undefined): RequestBodyBuilder {
    return new RequestBodyBuilder().setOptionalNullable(
      'folderId',
      targetId === undefined ? null : targetId
    );
  }
}

/**
 * Convenience function to build request body from args
 */
export function buildRequestBody(
  required: Record<string, unknown>,
  optional: Record<string, unknown> = {}
): Record<string, unknown> {
  const builder = new RequestBodyBuilder();
  builder.setRequiredMany(required);
  builder.setOptionalMany(optional);
  return builder.build();
}
