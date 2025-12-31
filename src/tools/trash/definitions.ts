/**
 * MCP tool definitions for trash operations
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Trash tool definitions (3 tools)
 */
export const trashTools: Tool[] = [
  {
    name: 'list_trash',
    description:
      'Retrieve all files and folders in the trash. Items remain in trash until permanently deleted or restored.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'integer',
          description: 'Number of items to return',
        },
        offset: {
          type: 'integer',
          description: 'Number of items to skip for pagination',
        },
        sortBy: {
          type: 'string',
          enum: ['name', 'size', 'trashedAt', 'updatedAt', 'createdAt'],
          description: 'Field to sort by',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort direction',
        },
      },
    },
  },
  {
    name: 'restore_from_trash',
    description:
      'Restore a file or folder from the trash back to its original location. If the original parent folder no longer exists, the item is restored to the root directory.',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'The unique identifier of the file or folder to restore',
        },
        type: {
          type: 'string',
          enum: ['file', 'folder'],
          description: 'Type of item to restore. If not provided, the system will auto-detect.',
        },
      },
      required: ['itemId'],
    },
  },
  {
    name: 'empty_trash',
    description:
      'Permanently delete all items in the trash. This action cannot be undone and will free up storage space.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Trash tool names
 */
export const TRASH_TOOL_NAMES = ['list_trash', 'restore_from_trash', 'empty_trash'] as const;

export type TrashToolName = (typeof TRASH_TOOL_NAMES)[number];

/**
 * Check if a tool name is a trash tool
 */
export function isTrashTool(name: string): name is TrashToolName {
  return TRASH_TOOL_NAMES.includes(name as TrashToolName);
}
