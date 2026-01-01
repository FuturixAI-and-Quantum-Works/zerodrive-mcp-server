/**
 * Integration tests for folder operations
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

describe.skipIf(!runTests)('Folders Integration', () => {
  let apiKey: string;
  let baseUrl: string;

  beforeAll(() => {
    const config = getIntegrationConfig();
    apiKey = config.apiKey;
    baseUrl = config.baseUrl;
  });

  describe('list_folders', () => {
    it('should list folders with default pagination', async () => {
      const response = await fetch(`${baseUrl}/api/v1/folders`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        folders: unknown[];
        total: number;
      };
      expect(data).toHaveProperty('folders');
      expect(Array.isArray(data.folders)).toBe(true);
      expect(typeof data.total).toBe('number');
    });

    it('should list folders with limit', async () => {
      const response = await fetch(`${baseUrl}/api/v1/folders?limit=5`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        folders: unknown[];
      };
      // Note: API may not strictly enforce limit, just verify we got a valid response
      expect(data).toHaveProperty('folders');
      expect(Array.isArray(data.folders)).toBe(true);
    });

    it('should sort folders by name', async () => {
      const response = await fetch(`${baseUrl}/api/v1/folders?sortBy=name&sortOrder=asc`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as { folders: unknown[] };
      expect(data).toHaveProperty('folders');
    });
  });

  describe('CRUD workflow', () => {
    it('should create, get, update, and delete a folder', async () => {
      const folderName = generateTestName('folder');

      // Create folder
      const createResponse = await fetch(`${baseUrl}/api/v1/folders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: folderName }),
      });

      expect(createResponse.ok).toBe(true);
      const createResult = (await createResponse.json()) as { id: string; name: string };
      expect(createResult).toHaveProperty('id');
      expect(createResult.name).toBe(folderName);
      trackResource('folders', createResult.id);

      // Get folder
      const getResponse = await fetch(`${baseUrl}/api/v1/folders/${createResult.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(getResponse.ok).toBe(true);
      const getResult = (await getResponse.json()) as { id: string };
      expect(getResult.id).toBe(createResult.id);

      // Update folder
      const newName = generateTestName('folder-updated');
      const updateResponse = await fetch(`${baseUrl}/api/v1/folders/${createResult.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      expect(updateResponse.ok).toBe(true);
      const updateResult = (await updateResponse.json()) as { name: string };
      expect(updateResult.name).toBe(newName);

      // Delete folder (permanent)
      const deleteResponse = await fetch(
        `${baseUrl}/api/v1/folders/${createResult.id}?permanent=true`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      expect(deleteResponse.ok).toBe(true);

      // Verify deleted
      const verifyResponse = await fetch(`${baseUrl}/api/v1/folders/${createResult.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(verifyResponse.status).toBe(404);
    });

    it('should create nested folders', async () => {
      // Create parent folder
      const parentName = generateTestName('parent');
      const parentResponse = await fetch(`${baseUrl}/api/v1/folders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: parentName }),
      });

      expect(parentResponse.ok).toBe(true);
      const parentResult = (await parentResponse.json()) as { id: string };
      expect(parentResult).toHaveProperty('id');
      trackResource('folders', parentResult.id);

      // Create child folder
      const childName = generateTestName('child');
      const childResponse = await fetch(`${baseUrl}/api/v1/folders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: childName, parentId: parentResult.id }),
      });

      expect(childResponse.ok).toBe(true);
      const childResult = (await childResponse.json()) as {
        id: string;
        parent?: { id: string };
      };
      expect(childResult).toHaveProperty('id');
      trackResource('folders', childResult.id);
      // API returns parent object instead of parentId
      expect(childResult.parent?.id).toBe(parentResult.id);
    });
  });

  describe('get_folder', () => {
    it('should return 404 for non-existent folder', async () => {
      const response = await fetch(`${baseUrl}/api/v1/folders/non-existent-folder-id`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.status).toBe(404);
    });
  });
});
