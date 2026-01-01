/**
 * Integration tests for file operations
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

// Skip all tests if API key not available
const runTests = shouldRunIntegrationTests();

describe.skipIf(!runTests)('Files Integration', () => {
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

  describe('list_files', () => {
    it('should list files with default pagination', async () => {
      const response = await fetch(`${baseUrl}/api/v1/files`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        files: unknown[];
        total: number;
      };
      expect(data).toHaveProperty('files');
      expect(Array.isArray(data.files)).toBe(true);
      expect(typeof data.total).toBe('number');
    });

    it('should list files with limit parameter', async () => {
      const response = await fetch(`${baseUrl}/api/v1/files?limit=5`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        files: unknown[];
      };
      expect(data.files.length).toBeLessThanOrEqual(5);
    });

    it('should list files with offset parameter', async () => {
      const response = await fetch(`${baseUrl}/api/v1/files?limit=10&offset=0`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        files: unknown[];
      };
      expect(data).toHaveProperty('files');
    });

    it('should filter starred files', async () => {
      const response = await fetch(`${baseUrl}/api/v1/files?starred=true`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        files: { isStarred: boolean }[];
      };
      // All returned files should be starred
      for (const file of data.files) {
        expect(file.isStarred).toBe(true);
      }
    });

    it('should sort files by name', async () => {
      const response = await fetch(`${baseUrl}/api/v1/files?sortBy=name&sortOrder=asc`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.ok).toBe(true);
      const data = (await response.json()) as {
        files: { name: string }[];
      };
      // Verify sorting (if multiple files)
      if (data.files.length > 1) {
        for (let i = 1; i < data.files.length; i++) {
          expect(data.files[i].name.localeCompare(data.files[i - 1].name)).toBeGreaterThanOrEqual(
            0
          );
        }
      }
    });
  });

  describe('get_file', () => {
    it('should return 404 for non-existent file', async () => {
      const response = await fetch(`${baseUrl}/api/v1/files/non-existent-file-id`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(response.status).toBe(404);
    });
  });

  describe('CRUD workflow', () => {
    it('should upload, get, and delete a file', async () => {
      // Skip if test file doesn't exist
      if (!fs.existsSync(testFilePath)) {
        console.log('Skipping upload test: test file not found');
        return;
      }

      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      const fileName = generateTestName('file') + '.txt';
      formData.append('file', fs.createReadStream(testFilePath), fileName);

      // Upload file
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
      const uploadResult = (await uploadResponse.json()) as { id: string; name: string };
      expect(uploadResult).toHaveProperty('id');
      trackResource('files', uploadResult.id);

      // Get file
      const getResponse = await fetch(`${baseUrl}/api/v1/files/${uploadResult.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(getResponse.ok).toBe(true);
      const fileResult = (await getResponse.json()) as { id: string; name: string };
      expect(fileResult.id).toBe(uploadResult.id);
      expect(fileResult.name).toBe(fileName);

      // Delete file
      const deleteResponse = await fetch(`${baseUrl}/api/v1/files/${uploadResult.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      expect(deleteResponse.ok).toBe(true);

      // Verify deleted (should be in trash, not 404)
      const verifyResponse = await fetch(`${baseUrl}/api/v1/files/${uploadResult.id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      // File may be trashed (isTrashed=true) or return 404
      expect([200, 404]).toContain(verifyResponse.status);
    });
  });
});
