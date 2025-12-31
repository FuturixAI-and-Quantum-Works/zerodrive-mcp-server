/**
 * Handler implementations for trash tools
 */

import { get, post, del } from '../../api/client.js';
import { TRASH_ENDPOINTS } from '../../api/endpoints.js';
import { QueryBuilder } from '../../utils/query-builder.js';
import { formatSuccess } from '../../utils/response-formatter.js';
import { parseArgs } from '../../schemas/common.js';
import {
  listTrashArgsSchema,
  restoreFromTrashArgsSchema,
  emptyTrashArgsSchema,
} from '../../schemas/trash.js';
import type { TrashToolName } from './definitions.js';

/**
 * Handle list_trash tool
 */
async function handleListTrash(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(listTrashArgsSchema, rawArgs);

  const query = new QueryBuilder().appendPagination(args).appendSort(args).build();

  const endpoint = query ? `${TRASH_ENDPOINTS.LIST}?${query}` : TRASH_ENDPOINTS.LIST;
  const result = await get(endpoint);
  return formatSuccess(result);
}

/**
 * Handle restore_from_trash tool
 */
async function handleRestoreFromTrash(rawArgs: Record<string, unknown>): Promise<string> {
  const args = parseArgs(restoreFromTrashArgsSchema, rawArgs);

  const query = new QueryBuilder().appendIfDefined('type', args.type).build();

  const baseEndpoint = TRASH_ENDPOINTS.RESTORE(args.itemId);
  const endpoint = query ? `${baseEndpoint}?${query}` : baseEndpoint;

  const result = await post(endpoint, {});
  return formatSuccess(result);
}

/**
 * Handle empty_trash tool
 */
async function handleEmptyTrash(rawArgs: Record<string, unknown>): Promise<string> {
  parseArgs(emptyTrashArgsSchema, rawArgs);

  const result = await del(TRASH_ENDPOINTS.EMPTY);
  return formatSuccess(result);
}

/**
 * Trash handlers map
 */
export const trashHandlers: Record<
  TrashToolName,
  (args: Record<string, unknown>) => Promise<string>
> = {
  list_trash: handleListTrash,
  restore_from_trash: handleRestoreFromTrash,
  empty_trash: handleEmptyTrash,
};

/**
 * Execute a trash tool
 */
export async function executeTrashTool(
  name: TrashToolName,
  args: Record<string, unknown>
): Promise<string> {
  const handler = trashHandlers[name];
  return handler(args);
}
