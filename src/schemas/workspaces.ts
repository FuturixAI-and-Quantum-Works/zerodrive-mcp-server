/**
 * Zod schemas for workspace tool inputs
 */

import { z } from 'zod';

import { WORKSPACE_STORAGE } from '../config/constants.js';

import {
  idSchema,
  optionalIdSchema,
  nonEmptyString,
  paginationSchema,
  fileSortSchema,
  folderSortSchema,
  workspaceFiltersSchema,
  hexColorSchema,
} from './common.js';

/**
 * list_workspaces arguments schema (no arguments needed)
 */
export const listWorkspacesArgsSchema = z.object({});

export type ListWorkspacesArgs = z.infer<typeof listWorkspacesArgsSchema>;

/**
 * create_workspace arguments schema
 */
export const createWorkspaceArgsSchema = z.object({
  name: nonEmptyString.max(100, 'Workspace name cannot exceed 100 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: hexColorSchema,
  storageAllocation: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val))
    .pipe(
      z
        .number()
        .int()
        .min(
          WORKSPACE_STORAGE.MIN_ALLOCATION,
          `Minimum storage allocation is ${WORKSPACE_STORAGE.MIN_ALLOCATION} bytes (100MB)`
        )
    ),
});

export type CreateWorkspaceArgs = z.infer<typeof createWorkspaceArgsSchema>;

/**
 * get_workspace arguments schema
 */
export const getWorkspaceArgsSchema = z.object({
  workspaceId: idSchema,
});

export type GetWorkspaceArgs = z.infer<typeof getWorkspaceArgsSchema>;

/**
 * upload_workspace_file arguments schema
 */
export const uploadWorkspaceFileArgsSchema = z.object({
  workspaceId: idSchema,
  filePath: z.string().min(1, 'File path is required'),
  folderId: optionalIdSchema,
});

export type UploadWorkspaceFileArgs = z.infer<typeof uploadWorkspaceFileArgsSchema>;

/**
 * list_workspace_files arguments schema
 */
export const listWorkspaceFilesArgsSchema = z
  .object({
    workspaceId: idSchema,
  })
  .merge(
    workspaceFiltersSchema.pick({ folderId: true, starred: true, trashed: true, search: true })
  )
  .merge(paginationSchema)
  .merge(fileSortSchema);

export type ListWorkspaceFilesArgs = z.infer<typeof listWorkspaceFilesArgsSchema>;

/**
 * list_workspace_folders arguments schema
 */
export const listWorkspaceFoldersArgsSchema = z
  .object({
    workspaceId: idSchema,
  })
  .merge(
    workspaceFiltersSchema.pick({ parentId: true, starred: true, trashed: true, search: true })
  )
  .merge(paginationSchema)
  .merge(folderSortSchema);

export type ListWorkspaceFoldersArgs = z.infer<typeof listWorkspaceFoldersArgsSchema>;

/**
 * create_workspace_folder arguments schema
 */
export const createWorkspaceFolderArgsSchema = z.object({
  workspaceId: idSchema,
  name: nonEmptyString.max(255, 'Folder name cannot exceed 255 characters'),
  parentId: optionalIdSchema,
  description: z.string().optional(),
  color: hexColorSchema,
});

export type CreateWorkspaceFolderArgs = z.infer<typeof createWorkspaceFolderArgsSchema>;

/**
 * get_workspace_folder arguments schema
 */
export const getWorkspaceFolderArgsSchema = z.object({
  workspaceId: idSchema,
  folderId: idSchema,
});

export type GetWorkspaceFolderArgs = z.infer<typeof getWorkspaceFolderArgsSchema>;

/**
 * update_workspace_folder arguments schema
 */
export const updateWorkspaceFolderArgsSchema = z.object({
  workspaceId: idSchema,
  folderId: idSchema,
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  color: hexColorSchema.nullable().optional(),
  parentId: optionalIdSchema,
  isStarred: z.boolean().optional(),
  isTrashed: z.boolean().optional(),
});

export type UpdateWorkspaceFolderArgs = z.infer<typeof updateWorkspaceFolderArgsSchema>;

/**
 * delete_workspace_folder arguments schema
 */
export const deleteWorkspaceFolderArgsSchema = z.object({
  workspaceId: idSchema,
  folderId: idSchema,
  permanent: z.boolean().optional().default(false),
});

export type DeleteWorkspaceFolderArgs = z.infer<typeof deleteWorkspaceFolderArgsSchema>;

/**
 * All workspace tool argument types
 */
export type WorkspaceToolArgs =
  | ListWorkspacesArgs
  | CreateWorkspaceArgs
  | GetWorkspaceArgs
  | UploadWorkspaceFileArgs
  | ListWorkspaceFilesArgs
  | ListWorkspaceFoldersArgs
  | CreateWorkspaceFolderArgs
  | GetWorkspaceFolderArgs
  | UpdateWorkspaceFolderArgs
  | DeleteWorkspaceFolderArgs;
