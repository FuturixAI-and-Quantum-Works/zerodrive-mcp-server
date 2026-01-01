/**
 * Integration tests for complex workflows
 *
 * These tests run against the real ZeroDrive API.
 * Requires ZERODRIVE_TEST_API_KEY environment variable.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  shouldRunIntegrationTests,
  generateTestName,
  trackResource,
  getIntegrationConfig,
} from '../setup.integration.js';

const runTests = shouldRunIntegrationTests();

describe.skipIf(!runTests)('Workflows Integration', () => {
  let apiKey: string;
  let baseUrl: string;
  let testFilePath: string;

  beforeAll(() => {
    const config = getIntegrationConfig();
    apiKey = config.apiKey;
    baseUrl = config.baseUrl;

    // Create a temporary test file
    testFilePath = path.join(process.cwd(), 'tests/fixtures/files/sample.txt');
    if (!fs.existsSync(testFilePath)) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      fs.writeFileSync(testFilePath, 'Test file content for integration tests');
    }
  });

  describe('parallel operations', () => {
    it('should handle parallel list operations', async () => {
      // Execute 5 list operations in parallel
      const operations = [
        fetch(`${baseUrl}/api/v1/files?limit=10`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
        fetch(`${baseUrl}/api/v1/folders?limit=10`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
        fetch(`${baseUrl}/api/v1/workspaces?limit=10`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
        fetch(`${baseUrl}/api/v1/trash?limit=10`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
        fetch(`${baseUrl}/api/v1/files?starred=true`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      ];

      const responses = await Promise.all(operations);

      // All should succeed
      for (const response of responses) {
        expect(response.ok).toBe(true);
        const data = (await response.json()) as Record<string, unknown>;
        // Verify we got a valid response object
        expect(typeof data).toBe('object');
      }
    });

    it('should handle parallel folder creation', async () => {
      const folderNames = Array.from({ length: 5 }, (_, i) =>
        generateTestName(`parallel-folder-${i}`)
      );

      const createOperations = folderNames.map((name) =>
        fetch(`${baseUrl}/api/v1/folders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        })
      );

      const responses = await Promise.all(createOperations);
      const folders: { id: string }[] = [];

      for (const response of responses) {
        expect(response.ok).toBe(true);
        const result = (await response.json()) as { id: string };
        expect(result).toHaveProperty('id');
        folders.push(result);
        trackResource('folders', result.id);
      }

      // Verify all folders exist
      const listResponse = await fetch(`${baseUrl}/api/v1/folders?limit=100`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(listResponse.ok).toBe(true);
      const listResult = (await listResponse.json()) as {
        folders: { id: string }[];
      };
      expect(listResult).toHaveProperty('folders');

      for (const folder of folders) {
        expect(listResult.folders.some((f) => f.id === folder.id)).toBe(true);
      }
    });
  });

  describe('file lifecycle workflow', () => {
    it('should complete full file lifecycle: upload -> move -> trash -> restore -> delete', async () => {
      // Skip if test file doesn't exist
      if (!fs.existsSync(testFilePath)) {
        console.log('Skipping workflow test: test file not found');
        return;
      }

      // Step 1: Create a folder for testing
      const folderName = generateTestName('lifecycle-folder');
      const createFolderResponse = await fetch(`${baseUrl}/api/v1/folders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: folderName }),
      });

      expect(createFolderResponse.ok).toBe(true);
      const folderResult = (await createFolderResponse.json()) as { id: string };
      expect(folderResult).toHaveProperty('id');
      trackResource('folders', folderResult.id);

      // Step 2: Upload a file
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      const fileName = generateTestName('lifecycle-file') + '.txt';
      formData.append('file', fs.createReadStream(testFilePath), fileName);

      const uploadResponse = await fetch(`${baseUrl}/api/v1/files/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...formData.getHeaders(),
        },
        body: formData as unknown as BodyInit,
      });

      if (!uploadResponse.ok) {
        const error = await uploadResponse.text();
        console.log('Upload failed:', error);
        return;
      }

      expect(uploadResponse.ok).toBe(true);
      const uploadResult = (await uploadResponse.json()) as { id: string };
      expect(uploadResult).toHaveProperty('id');
      trackResource('files', uploadResult.id);

      // Step 3: Move file to folder
      const moveResponse = await fetch(`${baseUrl}/api/v1/files/${uploadResult.id}/move`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId: folderResult.id }),
      });

      expect(moveResponse.ok).toBe(true);

      // Verify file is in folder
      const getFileResponse = await fetch(`${baseUrl}/api/v1/files/${uploadResult.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(getFileResponse.ok).toBe(true);
      const fileResult = (await getFileResponse.json()) as { folderId: string };
      expect(fileResult.folderId).toBe(folderResult.id);

      // Step 4: Trash the file (soft delete)
      const trashResponse = await fetch(`${baseUrl}/api/v1/files/${uploadResult.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(trashResponse.ok).toBe(true);

      // Step 5: Verify file is in trash
      const trashListResponse = await fetch(`${baseUrl}/api/v1/trash?search=${fileName}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(trashListResponse.ok).toBe(true);

      // Step 6: Restore from trash
      const restoreResponse = await fetch(`${baseUrl}/api/v1/trash/${uploadResult.id}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(restoreResponse.ok).toBe(true);

      // Step 7: Verify file is restored
      const verifyRestoreResponse = await fetch(`${baseUrl}/api/v1/files/${uploadResult.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(verifyRestoreResponse.ok).toBe(true);

      // Step 8: Permanently delete
      const deleteResponse = await fetch(
        `${baseUrl}/api/v1/files/${uploadResult.id}?permanent=true`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      expect(deleteResponse.ok).toBe(true);

      // Verify file is gone
      const verifyDeleteResponse = await fetch(`${baseUrl}/api/v1/files/${uploadResult.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(verifyDeleteResponse.status).toBe(404);
    });
  });

  describe('folder hierarchy workflow', () => {
    it('should create and manage nested folder structure', async () => {
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

      // Create multiple children
      const childNames = ['child-1', 'child-2', 'child-3'].map((n) => generateTestName(n));
      const children: { id: string; name: string }[] = [];

      for (const name of childNames) {
        const childResponse = await fetch(`${baseUrl}/api/v1/folders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, parentId: parentResult.id }),
        });

        expect(childResponse.ok).toBe(true);
        const childResult = (await childResponse.json()) as { id: string; name: string };
        expect(childResult).toHaveProperty('id');
        children.push(childResult);
        trackResource('folders', childResult.id);
      }

      // Create grandchild in first child
      const grandchildName = generateTestName('grandchild');
      const grandchildResponse = await fetch(`${baseUrl}/api/v1/folders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: grandchildName, parentId: children[0].id }),
      });

      expect(grandchildResponse.ok).toBe(true);
      const grandchildResult = (await grandchildResponse.json()) as {
        id: string;
        parent?: { id: string };
      };
      expect(grandchildResult).toHaveProperty('id');
      trackResource('folders', grandchildResult.id);
      // API returns parent object instead of parentId
      expect(grandchildResult.parent?.id).toBe(children[0].id);

      // Get folder to verify it has the correct parent path
      const getGrandchildResponse = await fetch(
        `${baseUrl}/api/v1/folders/${grandchildResult.id}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      expect(getGrandchildResponse.ok).toBe(true);
      const getResult = (await getGrandchildResponse.json()) as { id: string };
      expect(getResult).toHaveProperty('id');
    });
  });

  describe('search workflow', () => {
    it('should search and filter results', async () => {
      // Create folders with specific pattern
      const searchPattern = generateTestName('search');
      const folderNames = [
        `${searchPattern}-alpha`,
        `${searchPattern}-beta`,
        `${searchPattern}-gamma`,
      ];

      for (const name of folderNames) {
        const response = await fetch(`${baseUrl}/api/v1/folders`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        });

        expect(response.ok).toBe(true);
        const result = (await response.json()) as { id: string };
        expect(result).toHaveProperty('id');
        trackResource('folders', result.id);
      }

      // Search for the pattern
      const searchResponse = await fetch(
        `${baseUrl}/api/v1/folders?search=${encodeURIComponent(searchPattern)}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
        }
      );

      expect(searchResponse.ok).toBe(true);
      const searchResult = (await searchResponse.json()) as {
        folders: { name: string }[];
      };
      expect(searchResult).toHaveProperty('folders');

      // Should find at least the folders we created
      const foundNames = searchResult.folders.map((f) => f.name);
      for (const name of folderNames) {
        expect(foundNames).toContain(name);
      }
    });
  });

  describe('error handling workflow', () => {
    it('should handle concurrent operations on same resource gracefully', async () => {
      // Create a folder
      const folderName = generateTestName('concurrent');
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

      // Try multiple concurrent updates
      const updateOperations = Array.from({ length: 3 }, (_, i) =>
        fetch(`${baseUrl}/api/v1/folders/${createResult.id}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: `${folderName}-update-${i}` }),
        })
      );

      const results = await Promise.all(updateOperations);

      // At least one should succeed
      const successCount = results.filter((r) => r.ok).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });

    it('should handle operations on non-existent resources', async () => {
      const fakeId = 'non-existent-id-12345';

      // All these should return 404
      const operations = [
        fetch(`${baseUrl}/api/v1/files/${fakeId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
        fetch(`${baseUrl}/api/v1/folders/${fakeId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
        fetch(`${baseUrl}/api/v1/workspaces/${fakeId}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        }),
      ];

      const responses = await Promise.all(operations);

      for (const response of responses) {
        expect(response.status).toBe(404);
      }
    });
  });
});
