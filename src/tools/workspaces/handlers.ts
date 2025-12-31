/**
 * Handler implementations for workspace tools
 */

import { get, post, patch, del } from '../../api/client.js';
import { WORKSPACE_ENDPOINTS } from '../../api/endpoints.js';
import { QueryBuilder } from '../../utils/query-builder.js';
import { RequestBodyBuilder } from '../../utils/request-builder.js';
import { uploadWorkspaceFile as uploadToWorkspace } from '../../utils/upload-handler.js';
import { formatSuccess } from '../../utils/response-formatter.js';
import { parseArgs } from '../../schemas/common.js';
import {
  listWorkspacesArgsSchema,
  createWorkspaceArgsSchema,
  getWorkspaceArgsSchema,
  uploadWorkspaceFileArgsSchema,
  listWorkspaceFilesArgsSchema,
  listWorkspaceFoldersArgsSchema,
  createWorkspaceFolderArgsSchema,
  getWorkspaceFolderArgsSchema,
  updateWorkspaceFolderArgsSchema,
  deleteWorkspaceFolderArgsSchema,
} from '../../schemas/workspaces.js';
import type { WorkspaceToolName } from './definitions.js';

/**
 * Handle list_workspaces tool
 */
async function handleListWorkspaces(rawArgs: Record<string, unknown>): Promise<string> {
  parseArgs(listWorkspacesArgsSchema, rawArgs);
  const result = await get(WORKSPACE_ENDPOINTS.LIST);
  return formatSuccess(result);
}

/**
 * Handle create_workspace tool
 */
async function handleCreateWorkspace(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(createWorkspaceArgsSchema, rawArgs);

  const body = RequestBodyBuilder.forWorkspaceCreate({
    name: args.name,
    storageAllocation: args.storageAllocation,
    description: args.description,
    icon: args.icon,
    color: args.color,
  }).build();

  const result = await post(WORKSPACE_ENDPOINTS.CREATE, body);
  return formatSuccess(result);
}

/**
 * Handle get_workspace tool
 */
async function handleGetWorkspace(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(getWorkspaceArgsSchema, rawArgs);
  const result = await get(WORKSPACE_ENDPOINTS.GET(args.workspaceId));
  return formatSuccess(result);
}

/**
 * Handle upload_workspace_file tool
 */
async function handleUploadWorkspaceFile(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(uploadWorkspaceFileArgsSchema, rawArgs);

  const response = await uploadToWorkspace(args.workspaceId, args.filePath, args.folderId);

  if (!response.success) {
    throw new Error(response.error ?? 'Upload failed');
  }

  return formatSuccess(response.data);
}

/**
 * Handle list_workspace_files tool
 */
async function handleListWorkspaceFiles(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(listWorkspaceFilesArgsSchema, rawArgs);

  const query = new QueryBuilder()
    .appendWorkspaceFilters({
      folderId: args.folderId,
      starred: args.starred,
      trashed: args.trashed,
      search: args.search,
    })
    .appendPagination(args)
    .appendSort(args)
    .build();

  const baseEndpoint = WORKSPACE_ENDPOINTS.LIST_FILES(args.workspaceId);
  const endpoint = query ? `${baseEndpoint}?${query}` : baseEndpoint;
  const result = await get(endpoint);
  return formatSuccess(result);
}

/**
 * Handle list_workspace_folders tool
 */
async function handleListWorkspaceFolders(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(listWorkspaceFoldersArgsSchema, rawArgs);

  const query = new QueryBuilder()
    .appendWorkspaceFilters({
      parentId: args.parentId,
      starred: args.starred,
      trashed: args.trashed,
      search: args.search,
    })
    .appendPagination(args)
    .appendSort(args)
    .build();

  const baseEndpoint = WORKSPACE_ENDPOINTS.LIST_FOLDERS(args.workspaceId);
  const endpoint = query ? `${baseEndpoint}?${query}` : baseEndpoint;
  const result = await get(endpoint);
  return formatSuccess(result);
}

/**
 * Handle create_workspace_folder tool
 */
async function handleCreateWorkspaceFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(createWorkspaceFolderArgsSchema, rawArgs);

  const body = new RequestBodyBuilder()
    .setRequired('name', args.name)
    .setOptionalNullable('parentId', args.parentId)
    .setOptional('description', args.description)
    .setOptional('color', args.color)
    .build();

  const result = await post(WORKSPACE_ENDPOINTS.CREATE_FOLDER(args.workspaceId), body);
  return formatSuccess(result);
}

/**
 * Handle get_workspace_folder tool
 */
async function handleGetWorkspaceFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(getWorkspaceFolderArgsSchema, rawArgs);
  const result = await get(WORKSPACE_ENDPOINTS.GET_FOLDER(args.workspaceId, args.folderId));
  return formatSuccess(result);
}

/**
 * Handle update_workspace_folder tool
 */
async function handleUpdateWorkspaceFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(updateWorkspaceFolderArgsSchema, rawArgs);

  const body = RequestBodyBuilder.forFolder({
    name: args.name,
    description: args.description,
    color: args.color,
    parentId: args.parentId,
    isStarred: args.isStarred,
    isTrashed: args.isTrashed,
  }).build();

  const result = await patch(
    WORKSPACE_ENDPOINTS.UPDATE_FOLDER(args.workspaceId, args.folderId),
    body
  );
  return formatSuccess(result);
}

/**
 * Handle delete_workspace_folder tool
 */
async function handleDeleteWorkspaceFolder(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(deleteWorkspaceFolderArgsSchema, rawArgs);

  const query = new QueryBuilder().appendBoolean('permanent', args.permanent).build();

  const baseEndpoint = WORKSPACE_ENDPOINTS.DELETE_FOLDER(args.workspaceId, args.folderId);
  const endpoint = query ? `${baseEndpoint}?${query}` : baseEndpoint;
  const result = await del(endpoint);
  return formatSuccess(result);
}

/**
 * Workspace handlers map
 */
export const workspaceHandlers: Record<
  WorkspaceToolName,
  (args: Record<string, unknown>) => Promise<string>
> = {
  list_workspaces: handleListWorkspaces,
  create_workspace: handleCreateWorkspace,
  get_workspace: handleGetWorkspace,
  upload_workspace_file: handleUploadWorkspaceFile,
  list_workspace_files: handleListWorkspaceFiles,
  list_workspace_folders: handleListWorkspaceFolders,
  create_workspace_folder: handleCreateWorkspaceFolder,
  get_workspace_folder: handleGetWorkspaceFolder,
  update_workspace_folder: handleUpdateWorkspaceFolder,
  delete_workspace_folder: handleDeleteWorkspaceFolder,
};

/**
 * Execute a workspace tool
 */
export async function executeWorkspaceTool(
  name: WorkspaceToolName,
  args: Record<string, unknown>
): Promise<string> {
  const handler = workspaceHandlers[name];
  return handler(args);
}
