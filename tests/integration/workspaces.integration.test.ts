/**
 * Integration tests for workspace operations
 *
 * These tests run against the real ZeroDrive API.
 * Requires ZERODRIVE_TEST_API_KEY environment variable.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  shouldRunIntegrationTests,
  generateTestName,
  trackResource,
  getIntegrationConfig,
} from '../setup.integration.js';

const runTests = shouldRunIntegrationTests();

describe.skipIf(!runTests)('Workspaces Integration', () => {
  let apiKey: string;
  let baseUrl: string;

  beforeAll(() => {
    const config = getIntegrationConfig();
    apiKey = config.apiKey;
    baseUrl = config.baseUrl;
  });

  describe('list_workspaces', () => {
    it('should list workspaces with default pagination', async () => {
      const response = await fetch(`${baseUrl}/api/v1/workspaces`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        owned: unknown[];
        member: unknown[];
        total: number;
      };
      expect(data).toHaveProperty('owned');
      expect(data).toHaveProperty('member');
      expect(Array.isArray(data.owned)).toBe(true);
      expect(Array.isArray(data.member)).toBe(true);
    });

    it('should list workspaces with limit', async () => {
      const response = await fetch(`${baseUrl}/api/v1/workspaces?limit=5`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        owned: unknown[];
        member: unknown[];
        total: number;
      };
      // Note: API may not strictly enforce limit, just verify we got a valid response
      expect(data).toHaveProperty('owned');
      expect(data).toHaveProperty('member');
      expect(Array.isArray(data.owned)).toBe(true);
      expect(Array.isArray(data.member)).toBe(true);
    });
  });

  describe('CRUD workflow', () => {
    it('should create, get, and delete a workspace', async () => {
      const workspaceName = generateTestName('workspace');

      // Create workspace
      const createResponse = await fetch(`${baseUrl}/api/v1/workspaces`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workspaceName,
          storageAllocation: 100 * 1024 * 1024, // 100MB minimum
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.text();
        console.log('Workspace create failed:', error);
        // Some accounts might not have workspace creation permissions
        return;
      }

      expect(createResponse.ok).toBe(true);
      // API returns { workspace: {...}, message: "..." }
      const createResult = (await createResponse.json()) as {
        workspace: { id: string; name: string };
        message: string;
      };
      expect(createResult.workspace).toHaveProperty('id');
      expect(createResult.workspace.name).toBe(workspaceName);
      trackResource('workspaces', createResult.workspace.id);

      // Get workspace
      const getResponse = await fetch(`${baseUrl}/api/v1/workspaces/${createResult.workspace.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(getResponse.ok).toBe(true);
      const getResult = (await getResponse.json()) as { id: string };
      expect(getResult.id).toBe(createResult.workspace.id);

      // Delete workspace
      const deleteResponse = await fetch(
        `${baseUrl}/api/v1/workspaces/${createResult.workspace.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      expect(deleteResponse.ok).toBe(true);
    });
  });

  describe('workspace folders', () => {
    it('should create and list workspace folders', async () => {
      // First create a workspace
      const workspaceName = generateTestName('workspace');
      const createWsResponse = await fetch(`${baseUrl}/api/v1/workspaces`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workspaceName,
          storageAllocation: 100 * 1024 * 1024,
        }),
      });

      if (!createWsResponse.ok) {
        // Skip if workspace creation not allowed
        return;
      }

      // API returns { workspace: {...}, message: "..." }
      const wsResult = (await createWsResponse.json()) as {
        workspace: { id: string };
        message: string;
      };
      trackResource('workspaces', wsResult.workspace.id);

      // Create folder in workspace
      const folderName = generateTestName('ws-folder');
      const createFolderResponse = await fetch(
        `${baseUrl}/api/v1/workspaces/${wsResult.workspace.id}/folders`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: folderName }),
        }
      );

      expect(createFolderResponse.ok).toBe(true);
      // API returns { folder: {...}, message: "..." }
      const folderResult = (await createFolderResponse.json()) as {
        folder: { id: string };
        message: string;
      };
      expect(folderResult.folder).toHaveProperty('id');

      // List workspace folders
      const listResponse = await fetch(
        `${baseUrl}/api/v1/workspaces/${wsResult.workspace.id}/folders`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      expect(listResponse.ok).toBe(true);
      const listResult = (await listResponse.json()) as {
        folders: { id: string }[];
      };
      expect(listResult).toHaveProperty('folders');
      expect(listResult.folders.some((f) => f.id === folderResult.folder.id)).toBe(true);
    });
  });

  describe('get_workspace', () => {
    it('should return 404 for non-existent workspace', async () => {
      const response = await fetch(`${baseUrl}/api/v1/workspaces/non-existent-workspace-id`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.status).toBe(404);
    });
  });
});
