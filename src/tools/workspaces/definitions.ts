/**
 * MCP tool definitions for workspace operations
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Workspace tool definitions (10 tools)
 */
export const workspaceTools: Tool[] = [
  {
    name: 'list_workspaces',
    description:
      'Retrieve all workspaces the authenticated user owns or is a member of. Returns owned workspaces and member workspaces.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_workspace',
    description:
      "Create a new workspace with allocated storage. The storage is deducted from the user's available quota.",
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Workspace name (max 100 characters)',
        },
        description: {
          type: 'string',
          description: 'Workspace description',
        },
        icon: {
          type: 'string',
          description: 'Icon name or emoji for the workspace',
        },
        color: {
          type: 'string',
          description: 'Hex color code for the workspace',
        },
        storageAllocation: {
          type: 'string',
          description: 'Storage allocation in bytes (minimum 104857600 = 100MB)',
        },
      },
      required: ['name', 'storageAllocation'],
    },
  },
  {
    name: 'get_workspace',
    description:
      'Retrieve detailed information about a specific workspace, including members, storage usage, and user permissions.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'The unique identifier of the workspace',
        },
      },
      required: ['workspaceId'],
    },
  },
  {
    name: 'upload_workspace_file',
    description: 'Upload a file directly to a workspace. Requires EDITOR or higher workspace role.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'The unique identifier of the workspace',
        },
        filePath: {
          type: 'string',
          description: 'Local file path to upload (max 100MB)',
        },
        folderId: {
          type: 'string',
          description: 'Target folder ID within the workspace. Omit for workspace root.',
        },
      },
      required: ['workspaceId', 'filePath'],
    },
  },
  {
    name: 'list_workspace_files',
    description: 'List files in a workspace with filtering, pagination, and sorting options.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'The unique identifier of the workspace',
        },
        folderId: {
          type: 'string',
          description: "Filter by folder ID. Use 'null' or empty for root-level files.",
        },
        trashed: {
          type: 'boolean',
          description: 'Include trashed files in results',
        },
        starred: {
          type: 'boolean',
          description: 'Only return starred files',
        },
        search: {
          type: 'string',
          description: 'Search files by name (case-insensitive)',
        },
        limit: {
          type: 'integer',
          description: 'Number of files to return (max 100)',
        },
        offset: {
          type: 'integer',
          description: 'Number of files to skip for pagination',
        },
        sortBy: {
          type: 'string',
          enum: ['name', 'size', 'createdAt', 'updatedAt'],
          description: 'Field to sort by',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort direction',
        },
      },
      required: ['workspaceId'],
    },
  },
  {
    name: 'list_workspace_folders',
    description: 'List folders in a workspace with filtering, pagination, and sorting options.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'The unique identifier of the workspace',
        },
        parentId: {
          type: 'string',
          description: "Filter by parent folder ID. Use 'null' or empty for root-level folders.",
        },
        trashed: {
          type: 'boolean',
          description: 'Include trashed folders in results',
        },
        starred: {
          type: 'boolean',
          description: 'Only return starred folders',
        },
        search: {
          type: 'string',
          description: 'Search folders by name (case-insensitive)',
        },
        limit: {
          type: 'integer',
          description: 'Number of folders to return (max 100)',
        },
        offset: {
          type: 'integer',
          description: 'Number of folders to skip for pagination',
        },
        sortBy: {
          type: 'string',
          enum: ['name', 'createdAt', 'updatedAt'],
          description: 'Field to sort by',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort direction',
        },
      },
      required: ['workspaceId'],
    },
  },
  {
    name: 'create_workspace_folder',
    description: 'Create a new folder in a workspace. Requires EDITOR role or higher.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'The unique identifier of the workspace',
        },
        name: {
          type: 'string',
          description: 'Folder name (max 255 characters)',
        },
        parentId: {
          type: 'string',
          description: 'Parent folder ID. Omit or null for root level.',
        },
        description: {
          type: 'string',
          description: 'Optional folder description',
        },
        color: {
          type: 'string',
          description: 'Folder color (hex code)',
        },
      },
      required: ['workspaceId', 'name'],
    },
  },
  {
    name: 'get_workspace_folder',
    description:
      'Get detailed information about a folder in a workspace, including its full breadcrumb path.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'The unique identifier of the workspace',
        },
        folderId: {
          type: 'string',
          description: 'The unique identifier of the folder',
        },
      },
      required: ['workspaceId', 'folderId'],
    },
  },
  {
    name: 'update_workspace_folder',
    description:
      "Update a folder's properties including name, description, color, parent (move), starred status, or trash status. Requires EDITOR role or higher.",
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'The unique identifier of the workspace',
        },
        folderId: {
          type: 'string',
          description: 'The unique identifier of the folder to update',
        },
        name: {
          type: 'string',
          description: 'New folder name (max 255 characters)',
        },
        description: {
          type: 'string',
          description: 'New folder description (null to clear)',
        },
        color: {
          type: 'string',
          description: 'New folder color (hex code, null to clear)',
        },
        parentId: {
          type: 'string',
          description: 'Move folder to new parent (null for root level)',
        },
        isStarred: {
          type: 'boolean',
          description: 'Star or unstar the folder',
        },
        isTrashed: {
          type: 'boolean',
          description: 'Move to trash (true) or restore from trash (false)',
        },
      },
      required: ['workspaceId', 'folderId'],
    },
  },
  {
    name: 'delete_workspace_folder',
    description:
      'Delete a folder from a workspace. By default, folders are moved to trash. Use permanent=true to permanently delete.',
    inputSchema: {
      type: 'object',
      properties: {
        workspaceId: {
          type: 'string',
          description: 'The unique identifier of the workspace',
        },
        folderId: {
          type: 'string',
          description: 'The unique identifier of the folder to delete',
        },
        permanent: {
          type: 'boolean',
          description:
            'If true, permanently deletes the folder and all contents. Cannot be undone.',
        },
      },
      required: ['workspaceId', 'folderId'],
    },
  },
];

/**
 * Workspace tool names
 */
export const WORKSPACE_TOOL_NAMES = [
  'list_workspaces',
  'create_workspace',
  'get_workspace',
  'upload_workspace_file',
  'list_workspace_files',
  'list_workspace_folders',
  'create_workspace_folder',
  'get_workspace_folder',
  'update_workspace_folder',
  'delete_workspace_folder',
] as const;

export type WorkspaceToolName = (typeof WORKSPACE_TOOL_NAMES)[number];

/**
 * Check if a tool name is a workspace tool
 */
export function isWorkspaceTool(name: string): name is WorkspaceToolName {
  return WORKSPACE_TOOL_NAMES.includes(name as WorkspaceToolName);
}
