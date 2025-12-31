/**
 * Zod schemas for folder tool inputs
 */

import { z } from 'zod';

import {
  idSchema,
  optionalIdSchema,
  nonEmptyString,
  paginationSchema,
  folderSortSchema,
  folderFiltersSchema,
  emailArraySchema,
  shareOptionsSchema,
  hexColorSchema,
} from './common.js';

/**
 * list_folders arguments schema
 */
export const listFoldersArgsSchema = folderFiltersSchema
  .merge(paginationSchema)
  .merge(folderSortSchema);

export type ListFoldersArgs = z.infer<typeof listFoldersArgsSchema>;

/**
 * create_folder arguments schema
 */
export const createFolderArgsSchema = z.object({
  name: nonEmptyString.describe('Folder name'),
  parentId: optionalIdSchema,
  description: z.string().optional(),
});

export type CreateFolderArgs = z.infer<typeof createFolderArgsSchema>;

/**
 * get_folder arguments schema
 */
export const getFolderArgsSchema = z.object({
  folderId: idSchema,
});

export type GetFolderArgs = z.infer<typeof getFolderArgsSchema>;

/**
 * update_folder arguments schema
 */
export const updateFolderArgsSchema = z.object({
  folderId: idSchema,
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  color: hexColorSchema.nullable().optional(),
  isStarred: z.boolean().optional(),
  action: z.enum(['restore']).optional(),
});

export type UpdateFolderArgs = z.infer<typeof updateFolderArgsSchema>;

/**
 * delete_folder arguments schema
 */
export const deleteFolderArgsSchema = z.object({
  folderId: idSchema,
  permanent: z.boolean().optional().default(false),
});

export type DeleteFolderArgs = z.infer<typeof deleteFolderArgsSchema>;

/**
 * move_folder arguments schema
 */
export const moveFolderArgsSchema = z.object({
  folderId: idSchema,
  parentId: optionalIdSchema,
});

export type MoveFolderArgs = z.infer<typeof moveFolderArgsSchema>;

/**
 * share_folder arguments schema
 */
export const shareFolderArgsSchema = z
  .object({
    folderId: idSchema,
    emails: emailArraySchema,
  })
  .merge(shareOptionsSchema);

export type ShareFolderArgs = z.infer<typeof shareFolderArgsSchema>;

/**
 * All folder tool argument types
 */
export type FolderToolArgs =
  | ListFoldersArgs
  | CreateFolderArgs
  | GetFolderArgs
  | UpdateFolderArgs
  | DeleteFolderArgs
  | MoveFolderArgs
  | ShareFolderArgs;
