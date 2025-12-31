/**
 * Zod schemas for file tool inputs
 */

import { z } from 'zod';

import {
  idSchema,
  optionalIdSchema,
  paginationSchema,
  fileSortSchema,
  fileFiltersSchema,
  emailArraySchema,
  shareOptionsSchema,
} from './common.js';

/**
 * list_files arguments schema
 */
export const listFilesArgsSchema = fileFiltersSchema.merge(paginationSchema).merge(fileSortSchema);

export type ListFilesArgs = z.infer<typeof listFilesArgsSchema>;

/**
 * get_file arguments schema
 */
export const getFileArgsSchema = z.object({
  fileId: idSchema,
});

export type GetFileArgs = z.infer<typeof getFileArgsSchema>;

/**
 * upload_file arguments schema
 */
export const uploadFileArgsSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  folderPath: z.string().optional(),
});

export type UploadFileArgs = z.infer<typeof uploadFileArgsSchema>;

/**
 * download_file arguments schema
 */
export const downloadFileArgsSchema = z.object({
  fileId: idSchema,
});

export type DownloadFileArgs = z.infer<typeof downloadFileArgsSchema>;

/**
 * generate_signed_url arguments schema
 */
export const generateSignedUrlArgsSchema = z.object({
  fileId: idSchema,
  expires: z
    .number()
    .int()
    .min(3600, 'Minimum expiry is 3600 seconds (1 hour)')
    .max(604800, 'Maximum expiry is 604800 seconds (7 days)')
    .optional()
    .default(3600),
});

export type GenerateSignedUrlArgs = z.infer<typeof generateSignedUrlArgsSchema>;

/**
 * fetch_file_content arguments schema
 */
export const fetchFileContentArgsSchema = z.object({
  fileId: idSchema,
  download: z.boolean().optional().default(false),
});

export type FetchFileContentArgs = z.infer<typeof fetchFileContentArgsSchema>;

/**
 * move_file arguments schema
 */
export const moveFileArgsSchema = z.object({
  fileId: idSchema,
  folderId: optionalIdSchema,
});

export type MoveFileArgs = z.infer<typeof moveFileArgsSchema>;

/**
 * share_file arguments schema
 */
export const shareFileArgsSchema = z
  .object({
    fileId: idSchema,
    emails: emailArraySchema,
  })
  .merge(shareOptionsSchema);

export type ShareFileArgs = z.infer<typeof shareFileArgsSchema>;

/**
 * All file tool argument types
 */
export type FileToolArgs =
  | ListFilesArgs
  | GetFileArgs
  | UploadFileArgs
  | DownloadFileArgs
  | GenerateSignedUrlArgs
  | FetchFileContentArgs
  | MoveFileArgs
  | ShareFileArgs;
