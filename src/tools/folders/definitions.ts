/**
 * MCP tool definitions for folder operations
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Folder tool definitions (7 tools)
 */
export const folderTools: Tool[] = [
  {
    name: 'list_folders',
    description:
      'Retrieve a paginated list of folders from ZeroDrive with optional filtering, sorting, and search capabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'string',
          description: 'Parent folder ID to list subfolders. Omit for root folders.',
        },
        starred: {
          type: 'boolean',
          description: 'Filter to show only starred folders',
        },
        shared: {
          type: 'boolean',
          description: 'Filter to show only shared folders',
        },
        trashed: {
          type: 'boolean',
          description: 'Include trashed folders in results',
        },
        search: {
          type: 'string',
          description: 'Search query to filter folders by name',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of folders to return',
        },
        offset: {
          type: 'integer',
          description: 'Number of folders to skip for pagination',
        },
        sortBy: {
          type: 'string',
          enum: ['name', 'createdAt', 'updatedAt'],
          description: 'Field to sort results by',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order direction',
        },
      },
    },
  },
  {
    name: 'create_folder',
    description:
      'Create a new folder in ZeroDrive. Can be created at root level or as a subfolder of an existing folder.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the folder',
        },
        parentId: {
          type: 'string',
          description: 'Parent folder ID. Omit to create at root level.',
        },
        description: {
          type: 'string',
          description: 'Optional description for the folder',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_folder',
    description: 'Retrieve detailed information about a specific folder by its ID from ZeroDrive.',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'string',
          description: 'The unique identifier of the folder',
        },
      },
      required: ['folderId'],
    },
  },
  {
    name: 'update_folder',
    description:
      'Update folder properties such as name, description, color, or starred status. Can also restore a folder from trash.',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'string',
          description: 'The unique identifier of the folder to update',
        },
        name: {
          type: 'string',
          description: 'New name for the folder',
        },
        description: {
          type: 'string',
          description: 'Folder description',
        },
        color: {
          type: 'string',
          description: 'Folder color (hex code, e.g., #FF5733)',
        },
        isStarred: {
          type: 'boolean',
          description: 'Star or unstar the folder',
        },
        action: {
          type: 'string',
          enum: ['restore'],
          description: "Special action. Use 'restore' to restore folder from trash.",
        },
      },
      required: ['folderId'],
    },
  },
  {
    name: 'delete_folder',
    description:
      'Delete a folder and all its contents. By default, moves to trash (soft delete). Use permanent=true to permanently delete.',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'string',
          description: 'The unique identifier of the folder to delete',
        },
        permanent: {
          type: 'boolean',
          description: 'If true, permanently deletes the folder instead of moving to trash',
        },
      },
      required: ['folderId'],
    },
  },
  {
    name: 'move_folder',
    description:
      'Move a folder to a different parent folder. Set parentId to null to move the folder to the root directory.',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'string',
          description: 'The unique identifier of the folder to move',
        },
        parentId: {
          type: 'string',
          description: 'The destination parent folder ID. Use null or omit to move to root.',
        },
      },
      required: ['folderId'],
    },
  },
  {
    name: 'share_folder',
    description:
      'Share a folder and its contents with other users by email. Recipients will receive an email notification and can access the folder through their ZeroDrive account.',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'string',
          description: 'The unique identifier of the folder to share',
        },
        emails: {
          type: 'array',
          items: { type: 'string' },
          description: 'Email addresses of users to share with',
        },
        role: {
          type: 'string',
          enum: ['viewer', 'editor'],
          description: 'Permission level for shared users',
        },
        canShare: {
          type: 'boolean',
          description: 'Whether recipients can re-share the folder',
        },
        message: {
          type: 'string',
          description: 'Optional message to include in the share notification',
        },
      },
      required: ['folderId', 'emails'],
    },
  },
];

/**
 * Folder tool names
 */
export const FOLDER_TOOL_NAMES = [
  'list_folders',
  'create_folder',
  'get_folder',
  'update_folder',
  'delete_folder',
  'move_folder',
  'share_folder',
] as const;

export type FolderToolName = (typeof FOLDER_TOOL_NAMES)[number];

/**
 * Check if a tool name is a folder tool
 */
export function isFolderTool(name: string): name is FolderToolName {
  return FOLDER_TOOL_NAMES.includes(name as FolderToolName);
}
