/**
 * File upload handler utility
 * Consolidates upload logic from multiple handlers (~2 handlers, ~100 lines)
 */

import fs from 'fs';
import path from 'path';
import { URL } from 'url';

import FormData from 'form-data';

import { getConfig } from '../config/env.js';
import { FileOperationError, ErrorCode, NetworkError } from '../errors/base.js';
import { logger } from '../logging/logger.js';

/**
 * Upload configuration
 */
export interface UploadConfig {
  /** Local file path */
  filePath: string;
  /** API endpoint for upload */
  endpoint: string;
  /** Additional form fields */
  formFields?: Record<string, string>;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * Upload result
 */
export interface UploadResponse {
  /** Whether upload was successful */
  success: boolean;
  /** Response data from server */
  data?: unknown;
  /** Error message if failed */
  error?: string;
}

/**
 * Validate that a file exists and is readable
 */
export function validateFilePath(filePath: string): string {
  // Resolve to absolute path
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    throw new FileOperationError(`File not found: ${filePath}`, ErrorCode.FILE_NOT_FOUND, {
      filePath,
    });
  }

  // Check if it's a file (not directory)
  const stats = fs.statSync(absolutePath);
  if (!stats.isFile()) {
    throw new FileOperationError(`Path is not a file: ${filePath}`, ErrorCode.INVALID_FILE_TYPE, {
      filePath,
    });
  }

  return absolutePath;
}

/**
 * Get file name from path
 */
export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

/**
 * Upload a file to the specified endpoint
 * Handles FormData creation, streaming, and response parsing
 */
export async function uploadFile(config: UploadConfig): Promise<UploadResponse> {
  const { endpoint, formFields = {}, timeout = 120000 } = config;

  // Validate and get absolute path
  const absolutePath = validateFilePath(config.filePath);
  const fileName = getFileName(absolutePath);

  logger.debug('Starting file upload', {
    operation: 'upload',
    filePath: absolutePath,
    endpoint,
  });

  // Create form data
  const formData = new FormData();
  const fileStream = fs.createReadStream(absolutePath);
  formData.append('file', fileStream, fileName);

  // Add additional form fields
  for (const [key, value] of Object.entries(formFields)) {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  }

  // Get configuration
  const baseUrl = getConfig('ZERODRIVE_BASE_URL');
  const apiKey = getConfig('ZERODRIVE_API_KEY');
  const fullUrl = `${baseUrl}${endpoint}`;

  // Parse URL for http/https module
  const parsedUrl = new URL(fullUrl);

  return new Promise<UploadResponse>((resolve, reject) => {
    // Use form-data's submit method for proper multipart handling
    const submitOptions = {
      protocol: parsedUrl.protocol as 'https:' | 'http:',
      host: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? '443' : '80'),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...formData.getHeaders(),
      },
    };

    const req = formData.submit(submitOptions, (err, res) => {
      if (err) {
        logger.error('Upload request failed', {
          operation: 'upload',
          errorCode: 'NETWORK_ERROR',
        });
        reject(new NetworkError(`Upload failed: ${err.message}`));
        return;
      }

      let responseData = '';

      res.on('data', (chunk: Buffer) => {
        responseData += chunk.toString();
      });

      res.on('end', () => {
        const statusCode = res.statusCode ?? 500;

        if (statusCode >= 400) {
          logger.error('Upload failed', {
            operation: 'upload',
            statusCode,
          });
          resolve({
            success: false,
            error: `Upload failed with status ${statusCode}: ${responseData}`,
          });
          return;
        }

        try {
          const parsedData = JSON.parse(responseData) as unknown;
          logger.info('Upload completed successfully', {
            operation: 'upload',
          });
          resolve({
            success: true,
            data: parsedData,
          });
        } catch {
          // Response might not be JSON
          resolve({
            success: true,
            data: responseData,
          });
        }
      });

      res.on('error', (error: Error) => {
        logger.error('Upload response error', {
          operation: 'upload',
          errorCode: error.name,
        });
        reject(new NetworkError(`Upload response error: ${error.message}`));
      });
    });

    // Set timeout
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new NetworkError(`Upload timeout after ${timeout}ms`));
    });
  });
}

/**
 * Upload file to personal storage
 */
export async function uploadPersonalFile(
  filePath: string,
  folderPath?: string
): Promise<UploadResponse> {
  const formFields: Record<string, string> = {};
  if (folderPath) {
    formFields['folderPath'] = folderPath;
  }

  return uploadFile({
    filePath,
    endpoint: '/api/v1/files/upload',
    formFields,
  });
}

/**
 * Upload file to workspace
 */
export async function uploadWorkspaceFile(
  workspaceId: string,
  filePath: string,
  folderId?: string | null
): Promise<UploadResponse> {
  const formFields: Record<string, string> = {};
  if (folderId) {
    formFields['folderId'] = folderId;
  }

  return uploadFile({
    filePath,
    endpoint: `/api/v1/workspaces/${workspaceId}/files/upload`,
    formFields,
  });
}
