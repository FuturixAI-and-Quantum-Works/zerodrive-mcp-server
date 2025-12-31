/**
 * MCP tool definitions for file operations
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * File tool definitions (8 tools)
 */
export const fileTools: Tool[] = [
  {
    name: 'list_files',
    description:
      'Retrieve a paginated list of files from ZeroDrive with optional filtering, sorting, and search capabilities.',
    inputSchema: {
      type: 'object',
      properties: {
        folderId: {
          type: 'string',
          description: 'Filter files by folder ID. Omit to list files in root.',
        },
        includeSubfolders: {
          type: 'boolean',
          description: 'Include files from all subfolders recursively',
        },
        starred: {
          type: 'boolean',
          description: 'Filter to show only starred files',
        },
        shared: {
          type: 'boolean',
          description: 'Filter to show only shared files',
        },
        trashed: {
          type: 'boolean',
          description: 'Include trashed files in results',
        },
        search: {
          type: 'string',
          description: 'Search query to filter files by name',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of files to return',
        },
        offset: {
          type: 'integer',
          description: 'Number of files to skip for pagination',
        },
        sortBy: {
          type: 'string',
          enum: ['name', 'size', 'createdAt', 'updatedAt', 'mimeType'],
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
    name: 'get_file',
    description: 'Retrieve detailed metadata for a specific file by its ID from ZeroDrive.',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The unique identifier of the file',
        },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'upload_file',
    description:
      'Upload a file to ZeroDrive. Supports uploading from a local file path with optional folder path for automatic folder creation.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Local file path to upload',
        },
        folderPath: {
          type: 'string',
          description:
            "Folder path where file should be placed in ZeroDrive. Folders are created automatically if they don't exist.",
        },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'download_file',
    description:
      'Generate a signed URL for downloading a file from ZeroDrive. The URL is valid for 1 hour.',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The unique identifier of the file to download',
        },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'generate_signed_url',
    description:
      'Generate a time-limited signed URL for accessing a file without requiring API key authentication. Useful for sharing files or embedding in applications.',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The unique identifier of the file',
        },
        expires: {
          type: 'integer',
          description:
            'URL validity duration in seconds. Default: 3600 (1 hour), Maximum: 604800 (7 days)',
        },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'fetch_file_content',
    description:
      'Fetch and return the content of a text-based file from ZeroDrive. Best for text files, code files, JSON, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The unique identifier of the file to fetch',
        },
        download: {
          type: 'boolean',
          description: 'When true, forces download behavior instead of inline display',
        },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'move_file',
    description:
      'Move a file to a different folder. Set folderId to null to move the file to the root directory.',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The unique identifier of the file to move',
        },
        folderId: {
          type: 'string',
          description: 'The destination folder ID. Use null or omit to move to root.',
        },
      },
      required: ['fileId'],
    },
  },
  {
    name: 'share_file',
    description:
      'Share a file with other users by email. Recipients will receive an email notification and can access the file through their ZeroDrive account.',
    inputSchema: {
      type: 'object',
      properties: {
        fileId: {
          type: 'string',
          description: 'The unique identifier of the file to share',
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
          description: 'Whether recipients can re-share the file',
        },
        message: {
          type: 'string',
          description: 'Optional message to include in the share notification',
        },
      },
      required: ['fileId', 'emails'],
    },
  },
];

/**
 * File tool names
 */
export const FILE_TOOL_NAMES = [
  'list_files',
  'get_file',
  'upload_file',
  'download_file',
  'generate_signed_url',
  'fetch_file_content',
  'move_file',
  'share_file',
] as const;

export type FileToolName = (typeof FILE_TOOL_NAMES)[number];

/**
 * Check if a tool name is a file tool
 */
export function isFileTool(name: string): name is FileToolName {
  return FILE_TOOL_NAMES.includes(name as FileToolName);
}
