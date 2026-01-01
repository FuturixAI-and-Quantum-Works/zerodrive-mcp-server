/**
 * Test file generation utilities
 */

import { writeFileSync, mkdtempSync, unlinkSync, existsSync, statSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

/**
 * Temp files created during tests for cleanup tracking
 */
const tempFiles: string[] = [];

/**
 * Create a temporary file with specified size
 */
export function createTempFile(
  size: number,
  name: string,
  content?: string | Buffer
): string {
  const tmpDir = mkdtempSync(join(tmpdir(), 'zerodrive-test-'));
  const filePath = join(tmpDir, name);

  if (content !== undefined) {
    writeFileSync(filePath, content);
  } else {
    // Fill with 'x' characters for specified size
    const buffer = Buffer.alloc(size, 'x');
    writeFileSync(filePath, buffer);
  }

  tempFiles.push(filePath);
  return filePath;
}

/**
 * Create a temporary text file
 */
export function createTempTextFile(content: string, name: string = 'test.txt'): string {
  return createTempFile(content.length, name, content);
}

/**
 * Create a temporary JSON file
 */
export function createTempJsonFile(data: unknown, name: string = 'test.json'): string {
  const content = JSON.stringify(data, null, 2);
  return createTempFile(content.length, name, content);
}

/**
 * Create a large file (100MB - at the limit)
 */
export function createLargeFile(name: string = 'large-file.bin'): string {
  return createTempFile(100 * 1024 * 1024, name);
}

/**
 * Create a near-limit file (99MB)
 */
export function createNearLimitFile(name: string = 'near-limit.bin'): string {
  return createTempFile(99 * 1024 * 1024, name);
}

/**
 * Create an over-limit file (101MB)
 */
export function createOverLimitFile(name: string = 'over-limit.bin'): string {
  return createTempFile(101 * 1024 * 1024, name);
}

/**
 * Create a file with specific MIME type content
 */
export function createTypedFile(
  type: 'text' | 'json' | 'markdown' | 'binary',
  size: number = 100
): string {
  switch (type) {
    case 'text':
      return createTempFile(size, 'sample.txt', 'x'.repeat(size));
    case 'json':
      const json = JSON.stringify({ test: true, data: 'x'.repeat(Math.max(0, size - 30)) });
      return createTempFile(json.length, 'sample.json', json);
    case 'markdown':
      const md = `# Test\n\n${'Content '.repeat(Math.floor(size / 8))}`;
      return createTempFile(md.length, 'sample.md', md);
    case 'binary':
      return createTempFile(size, 'sample.bin');
    default:
      return createTempFile(size, 'sample.dat');
  }
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return statSync(filePath).size;
}

/**
 * Check if file exists
 */
export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

/**
 * Delete a temporary file
 */
export function deleteTempFile(filePath: string): boolean {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Clean up all temporary files created during tests
 */
export function cleanupTempFiles(): void {
  for (const filePath of tempFiles) {
    deleteTempFile(filePath);
  }
  tempFiles.length = 0;
}

/**
 * Get the path to a fixture file
 */
export function getFixturePath(filename: string): string {
  return join(__dirname, '..', 'fixtures', 'files', filename);
}

/**
 * File size constants for testing
 */
export const FILE_SIZES = {
  TINY: 100, // 100 bytes
  SMALL: 1024, // 1KB
  MEDIUM: 1024 * 1024, // 1MB
  LARGE: 10 * 1024 * 1024, // 10MB
  NEAR_LIMIT: 99 * 1024 * 1024, // 99MB
  AT_LIMIT: 100 * 1024 * 1024, // 100MB
  OVER_LIMIT: 101 * 1024 * 1024, // 101MB
} as const;
