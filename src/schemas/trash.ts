/**
 * Zod schemas for trash tool inputs
 */

import { z } from 'zod';

import { idSchema, paginationSchema, trashSortSchema } from './common.js';

/**
 * list_trash arguments schema
 */
export const listTrashArgsSchema = paginationSchema.merge(trashSortSchema);

export type ListTrashArgs = z.infer<typeof listTrashArgsSchema>;

/**
 * restore_from_trash arguments schema
 */
export const restoreFromTrashArgsSchema = z.object({
  itemId: idSchema,
  type: z.enum(['file', 'folder']).optional(),
});

export type RestoreFromTrashArgs = z.infer<typeof restoreFromTrashArgsSchema>;

/**
 * empty_trash arguments schema (no arguments needed)
 */
export const emptyTrashArgsSchema = z.object({});

export type EmptyTrashArgs = z.infer<typeof emptyTrashArgsSchema>;

/**
 * All trash tool argument types
 */
export type TrashToolArgs = ListTrashArgs | RestoreFromTrashArgs | EmptyTrashArgs;
