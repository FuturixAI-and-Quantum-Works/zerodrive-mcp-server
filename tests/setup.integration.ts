/**
 * Integration test setup
 *
 * This setup file configures the test environment for integration tests
 * that run against the real ZeroDrive API.
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

/**
 * Test resource tracker for cleanup
 */
interface TestResources {
  files: string[];
  folders: string[];
  workspaces: string[];
}

export const testResources: TestResources = {
  files: [],
  folders: [],
  workspaces: [],
};

/**
 * Generate a unique test ID with test- prefix
 */
export function generateTestId(): string {
  const uuid = Math.random().toString(36).substring(2, 10);
  return `test-${uuid}`;
}

/**
 * Generate a unique test name for resources
 */
export function generateTestName(prefix: string): string {
  return `${prefix}-${generateTestId()}`;
}

/**
 * Track a test resource for cleanup
 */
export function trackResource(type: keyof TestResources, id: string): void {
  testResources[type].push(id);
}

/**
 * Get API configuration for integration tests
 */
export function getIntegrationConfig(): { apiKey: string; baseUrl: string } {
  const apiKey = process.env['ZERODRIVE_TEST_API_KEY'];
  const baseUrl = process.env['ZERODRIVE_TEST_BASE_URL'] || 'https://drive.futurixai.com';

  if (!apiKey) {
    throw new Error(
      'ZERODRIVE_TEST_API_KEY environment variable is required for integration tests'
    );
  }

  return { apiKey, baseUrl };
}

/**
 * Check if integration tests should run
 */
export function shouldRunIntegrationTests(): boolean {
  return !!process.env['ZERODRIVE_TEST_API_KEY'];
}

/**
 * Clean up test resources created during a test
 */
export async function cleanupTestResources(): Promise<void> {
  const { apiKey, baseUrl } = getIntegrationConfig();

  // Clean up files first (they might be in folders)
  for (const fileId of testResources.files) {
    try {
      await fetch(`${baseUrl}/api/v1/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } catch {
      // Ignore cleanup errors
    }
  }
  testResources.files = [];

  // Clean up folders (child folders should be deleted with parent)
  for (const folderId of testResources.folders) {
    try {
      await fetch(`${baseUrl}/api/v1/folders/${folderId}?permanent=true`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } catch {
      // Ignore cleanup errors
    }
  }
  testResources.folders = [];

  // Clean up workspaces
  for (const workspaceId of testResources.workspaces) {
    try {
      await fetch(`${baseUrl}/api/v1/workspaces/${workspaceId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    } catch {
      // Ignore cleanup errors
    }
  }
  testResources.workspaces = [];
}

/**
 * Global cleanup sweep - find and delete any test-* resources
 */
export async function globalCleanupSweep(): Promise<void> {
  if (!shouldRunIntegrationTests()) return;

  const { apiKey, baseUrl } = getIntegrationConfig();

  // Clean up test files
  try {
    const filesResponse = await fetch(`${baseUrl}/api/v1/files?search=test-&limit=100`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (filesResponse.ok) {
      const result = (await filesResponse.json()) as {
        files: { id: string; name: string }[];
      };
      if (result.files) {
        for (const file of result.files) {
          if (file.name.startsWith('test-')) {
            await fetch(`${baseUrl}/api/v1/files/${file.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${apiKey}` },
            });
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }

  // Clean up test folders
  try {
    const foldersResponse = await fetch(`${baseUrl}/api/v1/folders?search=test-&limit=100`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (foldersResponse.ok) {
      const result = (await foldersResponse.json()) as {
        folders: { id: string; name: string }[];
      };
      if (result.folders) {
        for (const folder of result.folders) {
          if (folder.name.startsWith('test-')) {
            await fetch(`${baseUrl}/api/v1/folders/${folder.id}?permanent=true`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${apiKey}` },
            });
          }
        }
      }
    }
  } catch {
    // Ignore errors
  }

  // Empty trash
  try {
    await fetch(`${baseUrl}/api/v1/trash`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch {
    // Ignore errors
  }
}

// Setup hooks
beforeAll(async () => {
  if (!shouldRunIntegrationTests()) {
    console.log('Skipping integration tests: ZERODRIVE_TEST_API_KEY not set');
    return;
  }

  // Run global cleanup at start
  await globalCleanupSweep();
});

afterEach(async () => {
  // Clean up resources created in each test
  await cleanupTestResources();
});

afterAll(async () => {
  // Final cleanup sweep
  await globalCleanupSweep();
});
