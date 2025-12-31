/**
 * Handler implementations for folder tools
 */

import { get, post, patch, del, put } from '../../api/client.js';
import { FOLDER_ENDPOINTS } from '../../api/endpoints.js';
import { QueryBuilder } from '../../utils/query-builder.js';
import { RequestBodyBuilder } from '../../utils/request-builder.js';
import { formatSuccess } from '../../utils/response-formatter.js';
import { parseArgs } from '../../schemas/common.js';
import {
  listFoldersArgsSchema,
  createFolderArgsSchema,
  getFolderArgsSchema,
  updateFolderArgsSchema,
  deleteFolderArgsSchema,
  moveFolderArgsSchema,
  shareFolderArgsSchema,
} from '../../schemas/folders.js';
import type { FolderToolName } from './definitions.js';

/**
 * Handle list_folders tool
 */
async function handleListFolders(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(listFoldersArgsSchema, rawArgs);

  const query = new QueryBuilder()
    .appendFolderFilters(args)
    .appendPagination(args)
    .appendSort(args)
    .build();

  const endpoint = query ? `${FOLDER_ENDPOINTS.LIST}?${query}` : FOLDER_ENDPOINTS.LIST;
  const result = await get(endpoint);
  return formatSuccess(result);
}

/**
 * Handle create_folder tool
 */
async function handleCreateFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(createFolderArgsSchema, rawArgs);

  const body = new RequestBodyBuilder()
    .setRequired('name', args.name)
    .setOptionalNullable('parentId', args.parentId)
    .setOptional('description', args.description)
    .build();

  const result = await post(FOLDER_ENDPOINTS.CREATE, body);
  return formatSuccess(result);
}

/**
 * Handle get_folder tool
 */
async function handleGetFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(getFolderArgsSchema, rawArgs);
  const result = await get(FOLDER_ENDPOINTS.GET(args.folderId));
  return formatSuccess(result);
}

/**
 * Handle update_folder tool
 */
async function handleUpdateFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(updateFolderArgsSchema, rawArgs);

  const body = RequestBodyBuilder.forFolder({
    name: args.name,
    description: args.description,
    color: args.color,
    isStarred: args.isStarred,
    action: args.action,
  }).build();

  const result = await patch(FOLDER_ENDPOINTS.UPDATE(args.folderId), body);
  return formatSuccess(result);
}

/**
 * Handle delete_folder tool
 */
async function handleDeleteFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(deleteFolderArgsSchema, rawArgs);

  const query = new QueryBuilder().appendBoolean('permanent', args.permanent).build();

  const endpoint = query
    ? `${FOLDER_ENDPOINTS.DELETE(args.folderId)}?${query}`
    : FOLDER_ENDPOINTS.DELETE(args.folderId);

  const result = await del(endpoint);
  return formatSuccess(result);
}

/**
 * Handle move_folder tool
 */
async function handleMoveFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(moveFolderArgsSchema, rawArgs);

  const body = new RequestBodyBuilder()
    .setOptionalNullable('parentId', args.parentId ?? null)
    .build();

  const result = await put(FOLDER_ENDPOINTS.MOVE(args.folderId), body);
  return formatSuccess(result);
}

/**
 * Handle share_folder tool
 */
async function handleShareFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(shareFolderArgsSchema, rawArgs);

  const body = RequestBodyBuilder.forShare({
    emails: args.emails,
    role: args.role,
    canShare: args.canShare,
    message: args.message,
  }).build();

  const result = await post(FOLDER_ENDPOINTS.SHARE(args.folderId), body);
  return formatSuccess(result);
}

/**
 * Folder handlers map
 */
export const folderHandlers: Record<
  FolderToolName,
  (args: Record<string, unknown>) => Promise<string>
> = {
  list_folders: handleListFolders,
  create_folder: handleCreateFolder,
  get_folder: handleGetFolder,
  update_folder: handleUpdateFolder,
  delete_folder: handleDeleteFolder,
  move_folder: handleMoveFolder,
  share_folder: handleShareFolder,
};

/**
 * Execute a folder tool
 */
export async function executeFolderTool(
  name: FolderToolName,
  args: Record<string, unknown>
): Promise<string> {
  const handler = folderHandlers[name];
  return handler(args);
}
