/**
 * Unit tests for tool registry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  allTools,
  allToolNames,
  TOOL_COUNTS,
  isValidTool,
  getTool,
  executeTool,
  getToolCategory,
} from '../../../src/tools/registry.js';
import { mockFetchSuccess, mockFetchErrorResponse } from '../../mocks/fetch.mock.js';
import { createMockFile } from '../../mocks/entities.mock.js';
import { createPaginatedResponse } from '../../mocks/responses.mock.js';

describe('Tool Registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('allTools', () => {
    it('should contain 28 tools', () => {
      expect(allTools).toHaveLength(28);
    });

    it('should have unique tool names', () => {
      const names = allTools.map((tool) => tool.name);
      const uniqueNames = new Set(names);

      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have required tool structure', () => {
      for (const tool of allTools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
      }
    });
  });

  describe('TOOL_COUNTS', () => {
    it('should have correct file tools count', () => {
      expect(TOOL_COUNTS.files).toBe(8);
    });

    it('should have correct folder tools count', () => {
      expect(TOOL_COUNTS.folders).toBe(7);
    });

    it('should have correct workspace tools count', () => {
      expect(TOOL_COUNTS.workspaces).toBe(10);
    });

    it('should have correct trash tools count', () => {
      expect(TOOL_COUNTS.trash).toBe(3);
    });

    it('should have correct total', () => {
      expect(TOOL_COUNTS.total).toBe(28);
      expect(TOOL_COUNTS.total).toBe(
        TOOL_COUNTS.files + TOOL_COUNTS.folders + TOOL_COUNTS.workspaces + TOOL_COUNTS.trash
      );
    });
  });

  describe('allToolNames', () => {
    it('should be a Set', () => {
      expect(allToolNames).toBeInstanceOf(Set);
    });

    it('should contain all tool names', () => {
      expect(allToolNames.size).toBe(28);
    });

    it('should contain expected file tools', () => {
      expect(allToolNames.has('list_files')).toBe(true);
      expect(allToolNames.has('get_file')).toBe(true);
      expect(allToolNames.has('upload_file')).toBe(true);
      expect(allToolNames.has('download_file')).toBe(true);
      expect(allToolNames.has('generate_signed_url')).toBe(true);
      expect(allToolNames.has('fetch_file_content')).toBe(true);
      expect(allToolNames.has('move_file')).toBe(true);
      expect(allToolNames.has('share_file')).toBe(true);
    });

    it('should contain expected folder tools', () => {
      expect(allToolNames.has('list_folders')).toBe(true);
      expect(allToolNames.has('create_folder')).toBe(true);
      expect(allToolNames.has('get_folder')).toBe(true);
      expect(allToolNames.has('update_folder')).toBe(true);
      expect(allToolNames.has('delete_folder')).toBe(true);
      expect(allToolNames.has('move_folder')).toBe(true);
      expect(allToolNames.has('share_folder')).toBe(true);
    });

    it('should contain expected workspace tools', () => {
      expect(allToolNames.has('list_workspaces')).toBe(true);
      expect(allToolNames.has('create_workspace')).toBe(true);
      expect(allToolNames.has('get_workspace')).toBe(true);
      expect(allToolNames.has('upload_workspace_file')).toBe(true);
      expect(allToolNames.has('list_workspace_files')).toBe(true);
      expect(allToolNames.has('list_workspace_folders')).toBe(true);
      expect(allToolNames.has('create_workspace_folder')).toBe(true);
      expect(allToolNames.has('get_workspace_folder')).toBe(true);
      expect(allToolNames.has('update_workspace_folder')).toBe(true);
      expect(allToolNames.has('delete_workspace_folder')).toBe(true);
    });

    it('should contain expected trash tools', () => {
      expect(allToolNames.has('list_trash')).toBe(true);
      expect(allToolNames.has('restore_from_trash')).toBe(true);
      expect(allToolNames.has('empty_trash')).toBe(true);
    });
  });

  describe('isValidTool', () => {
    it('should return true for valid file tools', () => {
      expect(isValidTool('list_files')).toBe(true);
      expect(isValidTool('upload_file')).toBe(true);
    });

    it('should return true for valid folder tools', () => {
      expect(isValidTool('create_folder')).toBe(true);
      expect(isValidTool('delete_folder')).toBe(true);
    });

    it('should return true for valid workspace tools', () => {
      expect(isValidTool('list_workspaces')).toBe(true);
      expect(isValidTool('upload_workspace_file')).toBe(true);
    });

    it('should return true for valid trash tools', () => {
      expect(isValidTool('list_trash')).toBe(true);
      expect(isValidTool('empty_trash')).toBe(true);
    });

    it('should return false for invalid tool names', () => {
      expect(isValidTool('invalid_tool')).toBe(false);
      expect(isValidTool('')).toBe(false);
      expect(isValidTool('list-files')).toBe(false);
    });
  });

  describe('getTool', () => {
    it('should return tool definition for valid name', () => {
      const tool = getTool('list_files');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('list_files');
      expect(tool?.description).toBeDefined();
      expect(tool?.inputSchema).toBeDefined();
    });

    it('should return undefined for invalid name', () => {
      expect(getTool('invalid_tool')).toBeUndefined();
      expect(getTool('')).toBeUndefined();
    });

    it('should return correct tool for each category', () => {
      const fileTool = getTool('get_file');
      const folderTool = getTool('get_folder');
      const workspaceTool = getTool('get_workspace');
      const trashTool = getTool('list_trash');

      expect(fileTool?.name).toBe('get_file');
      expect(folderTool?.name).toBe('get_folder');
      expect(workspaceTool?.name).toBe('get_workspace');
      expect(trashTool?.name).toBe('list_trash');
    });
  });

  describe('getToolCategory', () => {
    it('should return "files" for file tools', () => {
      expect(getToolCategory('list_files')).toBe('files');
      expect(getToolCategory('get_file')).toBe('files');
      expect(getToolCategory('upload_file')).toBe('files');
      expect(getToolCategory('share_file')).toBe('files');
    });

    it('should return "folders" for folder tools', () => {
      expect(getToolCategory('list_folders')).toBe('folders');
      expect(getToolCategory('create_folder')).toBe('folders');
      expect(getToolCategory('delete_folder')).toBe('folders');
    });

    it('should return "workspaces" for workspace tools', () => {
      expect(getToolCategory('list_workspaces')).toBe('workspaces');
      expect(getToolCategory('create_workspace')).toBe('workspaces');
      expect(getToolCategory('upload_workspace_file')).toBe('workspaces');
    });

    it('should return "trash" for trash tools', () => {
      expect(getToolCategory('list_trash')).toBe('trash');
      expect(getToolCategory('restore_from_trash')).toBe('trash');
      expect(getToolCategory('empty_trash')).toBe('trash');
    });

    it('should return undefined for invalid tools', () => {
      expect(getToolCategory('invalid_tool')).toBeUndefined();
      expect(getToolCategory('')).toBeUndefined();
    });
  });

  describe('executeTool', () => {
    it('should execute file tool', async () => {
      const files = [createMockFile()];
      mockFetchSuccess(createPaginatedResponse(files));

      const result = await executeTool('list_files', {});
      const parsed = JSON.parse(result);

      expect(parsed.data).toHaveLength(1);
    });

    it('should execute folder tool', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      const result = await executeTool('list_folders', {});
      const parsed = JSON.parse(result);

      expect(parsed.data).toBeDefined();
    });

    it('should execute workspace tool', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      const result = await executeTool('list_workspaces', {});
      const parsed = JSON.parse(result);

      expect(parsed.data).toBeDefined();
    });

    it('should execute trash tool', async () => {
      mockFetchSuccess(createPaginatedResponse([]));

      const result = await executeTool('list_trash', {});
      const parsed = JSON.parse(result);

      expect(parsed.data).toBeDefined();
    });

    it('should throw for unknown tool', async () => {
      await expect(executeTool('unknown_tool', {})).rejects.toThrow('Unknown tool');
    });

    it('should pass arguments to handler', async () => {
      const file = createMockFile({ id: 'file-123' });
      mockFetchSuccess(file);

      const result = await executeTool('get_file', { fileId: 'file-123' });
      const parsed = JSON.parse(result);

      expect(parsed.id).toBe('file-123');
    });
  });
});
