/**
 * Tools module - MCP tool definitions and handlers
 *
 * This module exports all tool-related functionality organized by feature:
 * - File operations (8 tools)
 * - Folder operations (7 tools)
 * - Workspace operations (10 tools)
 * - Trash operations (3 tools)
 *
 * Total: 28 tools
 */

// Re-export from registry (main public API)
export {
  allTools,
  allToolNames,
  TOOL_COUNTS,
  isValidTool,
  getTool,
  executeTool,
  getToolCategory,
  type ToolCategory,
} from './registry.js';

// Re-export feature modules for direct access if needed
export * from './files/index.js';
export * from './folders/index.js';
export * from './workspaces/index.js';
export * from './trash/index.js';
