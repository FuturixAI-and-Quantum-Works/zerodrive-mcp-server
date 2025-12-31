/**
 * Response formatting utilities for MCP tool results
 */

import type { ToolResult, ToolResultContent } from '../types/api.js';
import { isZeroDriveError, type ZeroDriveError } from '../errors/base.js';

/**
 * Format data as a successful JSON response
 */
export function formatSuccess(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format error message
 */
export function formatError(error: unknown): string {
  if (isZeroDriveError(error)) {
    return formatZeroDriveError(error);
  }

  if (error instanceof Error) {
    return `Error: ${error.message}`;
  }

  if (typeof error === 'string') {
    return `Error: ${error}`;
  }

  return 'Error: An unknown error occurred';
}

/**
 * Format ZeroDriveError with context
 */
function formatZeroDriveError(error: ZeroDriveError): string {
  const parts = [`Error: ${error.message}`];

  if (error.code) {
    parts.push(`Code: ${error.code}`);
  }

  if (error.context && Object.keys(error.context).length > 0) {
    const contextStr = Object.entries(error.context)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');
    if (contextStr) {
      parts.push(`Context: { ${contextStr} }`);
    }
  }

  return parts.join('\n');
}

/**
 * Create MCP tool result for success
 */
export function createSuccessResult(data: unknown): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: formatSuccess(data),
      },
    ],
  };
}

/**
 * Create MCP tool result for error
 */
export function createErrorResult(error: unknown): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text: formatError(error),
      },
    ],
    isError: true,
  };
}

/**
 * Create MCP tool result for text content
 */
export function createTextResult(text: string): ToolResult {
  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

/**
 * Create MCP text content block
 */
export function createTextContent(text: string): ToolResultContent {
  return {
    type: 'text',
    text,
  };
}

/**
 * Wrap handler execution with error handling and formatting
 */
export async function withErrorHandling<T>(handler: () => Promise<T>): Promise<ToolResult> {
  try {
    const result = await handler();
    return createSuccessResult(result);
  } catch (error) {
    return createErrorResult(error);
  }
}

/**
 * Format a list of items with count
 */
export function formatList<T>(items: T[], itemFormatter?: (item: T) => string): string {
  if (items.length === 0) {
    return 'No items found.';
  }

  const formatter = itemFormatter ?? ((item: T) => JSON.stringify(item, null, 2));
  return items.map(formatter).join('\n\n');
}

/**
 * Format operation result message
 */
export function formatOperationResult(
  operation: string,
  success: boolean,
  details?: Record<string, unknown>
): string {
  const status = success ? 'successful' : 'failed';
  let message = `${operation} ${status}`;

  if (details && Object.keys(details).length > 0) {
    const detailsStr = Object.entries(details)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ');
    if (detailsStr) {
      message += `\nDetails: { ${detailsStr} }`;
    }
  }

  return message;
}

/**
 * Format byte size to human readable string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format date to ISO string
 */
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString();
  }
  return date.toISOString();
}
