/**
 * Common Zod schemas shared across tool categories
 */

import { z } from 'zod';

import { DEFAULT_PAGINATION } from '../config/constants.js';

/**
 * Non-empty string schema
 */
export const nonEmptyString = z.string().min(1, 'Value cannot be empty');

/**
 * ID schema (non-empty string)
 */
export const idSchema = z.string().min(1, 'ID is required');

/**
 * Optional ID schema (can be null or undefined for root)
 */
export const optionalIdSchema = z.string().nullable().optional();

/**
 * Email schema
 */
export const emailSchema = z.string().email('Invalid email address');

/**
 * Email array schema (at least one email)
 */
export const emailArraySchema = z.array(emailSchema).min(1, 'At least one email is required');

/**
 * Hex color schema
 */
export const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color code (e.g., #FF5733)')
  .optional();

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(DEFAULT_PAGINATION.MAX_LIMIT)
    .optional()
    .default(DEFAULT_PAGINATION.LIMIT),
  offset: z.number().int().min(0).optional().default(DEFAULT_PAGINATION.OFFSET),
});

/**
 * Sort schema for files
 */
export const fileSortSchema = z.object({
  sortBy: z.enum(['name', 'size', 'createdAt', 'updatedAt', 'mimeType']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Sort schema for folders
 */
export const folderSortSchema = z.object({
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Sort schema for trash
 */
export const trashSortSchema = z.object({
  sortBy: z.enum(['name', 'size', 'trashedAt', 'updatedAt', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Share role schema
 */
export const shareRoleSchema = z.enum(['viewer', 'editor']).optional().default('viewer');

/**
 * Share options schema
 */
export const shareOptionsSchema = z.object({
  role: shareRoleSchema,
  canShare: z.boolean().optional().default(false),
  message: z.string().max(500).optional(),
});

/**
 * File filters schema
 */
export const fileFiltersSchema = z.object({
  folderId: optionalIdSchema,
  includeSubfolders: z.boolean().optional(),
  starred: z.boolean().optional(),
  shared: z.boolean().optional(),
  trashed: z.boolean().optional(),
  search: z.string().optional(),
});

/**
 * Folder filters schema
 */
export const folderFiltersSchema = z.object({
  folderId: optionalIdSchema,
  starred: z.boolean().optional(),
  shared: z.boolean().optional(),
  trashed: z.boolean().optional(),
  search: z.string().optional(),
});

/**
 * Workspace filters schema
 */
export const workspaceFiltersSchema = z.object({
  folderId: optionalIdSchema,
  parentId: optionalIdSchema,
  starred: z.boolean().optional(),
  trashed: z.boolean().optional(),
  search: z.string().optional(),
});

/**
 * Boolean coercion helper for string inputs
 */
export const booleanCoerce = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val.toLowerCase() === 'true') return true;
    if (val.toLowerCase() === 'false') return false;
  }
  return val;
}, z.boolean().optional());

/**
 * Number coercion helper for string inputs
 */
export const numberCoerce = z.preprocess((val) => {
  if (typeof val === 'string') {
    const num = parseInt(val, 10);
    if (!isNaN(num)) return num;
  }
  return val;
}, z.number().int());

/**
 * Validate and parse arguments with a schema
 */
export function parseArgs<T extends z.ZodSchema>(
  schema: T,
  args: Record<string, unknown>
): z.infer<T> {
  return schema.parse(args);
}

/**
 * Safe parse with error formatting
 */
export function safeParseArgs<T extends z.ZodSchema>(
  schema: T,
  args: Record<string, unknown>
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  const result = schema.safeParse(args);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  return { success: false, error: errorMessages };
}
