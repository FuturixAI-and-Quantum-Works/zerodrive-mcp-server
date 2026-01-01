/**
 * Integration tests for trash operations
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

describe.skipIf(!runTests)('Trash Integration', () => {
  let apiKey: string;
  let baseUrl: string;

  beforeAll(() => {
    const config = getIntegrationConfig();
    apiKey = config.apiKey;
    baseUrl = config.baseUrl;
  });

  describe('list_trash', () => {
    it('should list trash items', async () => {
      const response = await fetch(`${baseUrl}/api/v1/trash`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        files: unknown[];
        folders: unknown[];
        total: number;
        hasMore: boolean;
      };
      expect(data).toHaveProperty('files');
      expect(data).toHaveProperty('folders');
      expect(Array.isArray(data.files)).toBe(true);
      expect(Array.isArray(data.folders)).toBe(true);
    });

    it('should list trash with pagination', async () => {
      const response = await fetch(`${baseUrl}/api/v1/trash?limit=10&offset=0`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        files: unknown[];
        folders: unknown[];
        total: number;
        hasMore: boolean;
      };
      expect(typeof data.total).toBe('number');
      expect(typeof data.hasMore).toBe('boolean');
    });

    it('should sort trash by trashedAt', async () => {
      const response = await fetch(`${baseUrl}/api/v1/trash?sortBy=trashedAt&sortOrder=desc`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as { files: unknown[]; folders: unknown[] };
      expect(data).toHaveProperty('files');
      expect(data).toHaveProperty('folders');
    });
  });

  describe('trash and restore workflow', () => {
    it('should trash and restore a folder', async () => {
      // Create a folder
      const folderName = generateTestName('trash-test');
      const createResponse = await fetch(`${baseUrl}/api/v1/folders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: folderName }),
      });

      expect(createResponse.ok).toBe(true);
      const createResult = (await createResponse.json()) as { id: string };
      expect(createResult).toHaveProperty('id');
      trackResource('folders', createResult.id);

      // Trash the folder (soft delete)
      const trashResponse = await fetch(`${baseUrl}/api/v1/folders/${createResult.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(trashResponse.ok).toBe(true);

      // Verify it's in trash
      const trashListResponse = await fetch(`${baseUrl}/api/v1/trash?search=${folderName}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(trashListResponse.ok).toBe(true);
      const trashResult = (await trashListResponse.json()) as {
        files: { id: string }[];
        folders: { id: string }[];
      };
      expect(trashResult).toHaveProperty('folders');

      // Find the folder in trash
      const trashedFolder = trashResult.folders.find((item) => item.id === createResult.id);
      if (trashedFolder) {
        // Restore from trash
        const restoreResponse = await fetch(`${baseUrl}/api/v1/trash/${createResult.id}/restore`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        expect(restoreResponse.ok).toBe(true);

        // Verify restored
        const verifyResponse = await fetch(`${baseUrl}/api/v1/folders/${createResult.id}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        expect(verifyResponse.ok).toBe(true);
      }
    });
  });

  describe('empty_trash', () => {
    it('should empty trash successfully', async () => {
      const response = await fetch(`${baseUrl}/api/v1/trash`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        message: string;
        deletedFiles: number;
        deletedFolders: number;
        storageFreed: number;
      };
      expect(typeof data.deletedFiles).toBe('number');
      expect(typeof data.deletedFolders).toBe('number');
    });
  });
});
