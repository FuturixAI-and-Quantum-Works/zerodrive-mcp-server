/**
 * Handler implementations for file tools
 */

import { get, post, put } from '../../api/client.js';
import { FILE_ENDPOINTS } from '../../api/endpoints.js';
import { QueryBuilder } from '../../utils/query-builder.js';
import { RequestBodyBuilder } from '../../utils/request-builder.js';
import { uploadPersonalFile } from '../../utils/upload-handler.js';
import { formatSuccess } from '../../utils/response-formatter.js';
import { parseArgs } from '../../schemas/common.js';
import {
  listFilesArgsSchema,
  getFileArgsSchema,
  uploadFileArgsSchema,
  downloadFileArgsSchema,
  generateSignedUrlArgsSchema,
  fetchFileContentArgsSchema,
  moveFileArgsSchema,
  shareFileArgsSchema,
} from '../../schemas/files.js';
import type { FileToolName } from './definitions.js';

/**
 * Handle list_files tool
 */
async function handleListFiles(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(listFilesArgsSchema, rawArgs);

  const query = new QueryBuilder()
    .appendFileFilters(args)
    .appendPagination(args)
    .appendSort(args)
    .build();

  const endpoint = query ? `${FILE_ENDPOINTS.LIST}?${query}` : FILE_ENDPOINTS.LIST;
  const result = await get(endpoint);
  return formatSuccess(result);
}

/**
 * Handle get_file tool
 */
async function handleGetFile(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(getFileArgsSchema, rawArgs);
  const result = await get(FILE_ENDPOINTS.GET(args.fileId));
  return formatSuccess(result);
}

/**
 * Handle upload_file tool
 */
async function handleUploadFile(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(uploadFileArgsSchema, rawArgs);
  const response = await uploadPersonalFile(args.filePath, args.folderPath);

  if (!response.success) {
    throw new Error(response.error ?? 'Upload failed');
  }

  return formatSuccess(response.data);
}

/**
 * Handle download_file tool
 */
async function handleDownloadFile(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(downloadFileArgsSchema, rawArgs);
  const result = await get(FILE_ENDPOINTS.DOWNLOAD(args.fileId));
  return formatSuccess(result);
}

/**
 * Handle generate_signed_url tool
 */
async function handleGenerateSignedUrl(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(generateSignedUrlArgsSchema, rawArgs);

  const query = new QueryBuilder().appendNumber('expires', args.expires).build();

  const endpoint = query
    ? `${FILE_ENDPOINTS.SIGNED_URL(args.fileId)}?${query}`
    : FILE_ENDPOINTS.SIGNED_URL(args.fileId);

  const result = await get(endpoint);
  return formatSuccess(result);
}

/**
 * Handle fetch_file_content tool
 */
async function handleFetchFileContent(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(fetchFileContentArgsSchema, rawArgs);

  const query = new QueryBuilder().appendBoolean('download', args.download).build();

  const endpoint = query
    ? `${FILE_ENDPOINTS.FETCH_CONTENT(args.fileId)}?${query}`
    : FILE_ENDPOINTS.FETCH_CONTENT(args.fileId);

  const result = await get<string>(endpoint);

  // Content might be plain text, not JSON
  if (typeof result === 'string') {
    return result;
  }

  return formatSuccess(result);
}

/**
 * Handle move_file tool
 */
async function handleMoveFile(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(moveFileArgsSchema, rawArgs);

  const body = RequestBodyBuilder.forMove(args.folderId).build();
  const result = await put(FILE_ENDPOINTS.MOVE(args.fileId), body);
  return formatSuccess(result);
}

/**
 * Handle share_file tool
 */
async function handleShareFile(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(shareFileArgsSchema, rawArgs);

  const body = RequestBodyBuilder.forShare({
    emails: args.emails,
    role: args.role,
    canShare: args.canShare,
    message: args.message,
  }).build();

  const result = await post(FILE_ENDPOINTS.SHARE(args.fileId), body);
  return formatSuccess(result);
}

/**
 * File handlers map
 */
export const fileHandlers: Record<
  FileToolName,
  (args: Record<string, unknown>) => Promise<string>
> = {
  list_files: handleListFiles,
  get_file: handleGetFile,
  upload_file: handleUploadFile,
  download_file: handleDownloadFile,
  generate_signed_url: handleGenerateSignedUrl,
  fetch_file_content: handleFetchFileContent,
  move_file: handleMoveFile,
  share_file: handleShareFile,
};

/**
 * Execute a file tool
 */
export async function executeFileTool(
  name: FileToolName,
  args: Record<string, unknown>
): Promise<string> {
  const handler = fileHandlers[name];
  return handler(args);
}
