/**
 * Central tool registry and dispatcher
 *
 * This module provides a unified interface for all MCP tools,
 * combining tool definitions and handlers from all feature modules.
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

import { fileTools, isFileTool, executeFileTool } from './files/index.js';
import { folderTools, isFolderTool, executeFolderTool } from './folders/index.js';
import { workspaceTools, isWorkspaceTool, executeWorkspaceTool } from './workspaces/index.js';
import { trashTools, isTrashTool, executeTrashTool } from './trash/index.js';

/**
 * All MCP tool definitions combined
 */
export const allTools: Tool[] = [...fileTools, ...folderTools, ...workspaceTools, ...trashTools];

/**
 * Tool count by category
 */
export const TOOL_COUNTS = {
  files: fileTools.length,
  folders: folderTools.length,
  workspaces: workspaceTools.length,
  trash: trashTools.length,
  total: allTools.length,
} as const;

/**
 * All tool names as a set for quick lookup
 */
export const allToolNames = new Set(allTools.map((tool) => tool.name));

/**
 * Check if a tool name is valid
 */
export function isValidTool(name: string): boolean {
  return allToolNames.has(name);
}

/**
 * Get a tool definition by name
 */
export function getTool(name: string): Tool | undefined {
  return allTools.find((tool) => tool.name === name);
}

/**
 * Execute a tool by name with the given arguments
 *
 * @param name - The tool name to execute
 * @param args - The arguments to pass to the tool
 * @returns The tool result as a formatted string
 * @throws Error if the tool name is unknown
 */
export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  // Route to the appropriate handler based on tool category
  if (isFileTool(name)) {
    return executeFileTool(name, args);
  }

  if (isFolderTool(name)) {
    return executeFolderTool(name, args);
  }

  if (isWorkspaceTool(name)) {
    return executeWorkspaceTool(name, args);
  }

  if (isTrashTool(name)) {
    return executeTrashTool(name, args);
  }

  throw new Error(`Unknown tool: ${name}`);
}

/**
 * Tool category information
 */
export type ToolCategory = 'files' | 'folders' | 'workspaces' | 'trash';

/**
 * Get the category of a tool by name
 */
export function getToolCategory(name: string): ToolCategory | undefined {
  if (isFileTool(name)) return 'files';
  if (isFolderTool(name)) return 'folders';
  if (isWorkspaceTool(name)) return 'workspaces';
  if (isTrashTool(name)) return 'trash';
  return undefined;
}
