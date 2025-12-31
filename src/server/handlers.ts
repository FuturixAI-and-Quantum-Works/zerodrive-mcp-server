/**
 * MCP request handlers
 *
 * Handles ListTools and CallTool requests from MCP clients.
 */

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

import { allTools, executeTool } from '../tools/index.js';
import { config } from '../config/index.js';
import { logger } from '../logging/index.js';
import { ZeroDriveError, ConfigurationError } from '../errors/index.js';

/**
 * Format an error for MCP response
 */
function formatError(error: unknown): CallToolResult {
  let errorMessage: string;

  if (error instanceof ZeroDriveError) {
    errorMessage = error.message;
    logger.error(`Tool execution failed: ${error.message}`, { errorCode: error.code });
  } else if (error instanceof Error) {
    errorMessage = error.message;
    logger.error(`Tool execution failed: ${error.message}`);
  } else {
    errorMessage = String(error);
    logger.error(`Tool execution failed: ${errorMessage}`);
  }

  return {
    content: [{ type: 'text', text: `Error: ${errorMessage}` }],
    isError: true,
  };
}

/**
 * Format a success result for MCP response
 */
function formatSuccessResult(result: string): CallToolResult {
  return {
    content: [{ type: 'text', text: result }],
  };
}

/**
 * Register all MCP request handlers on the server
 */
export function registerHandlers(server: Server): void {
  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    logger.debug(`Listing ${allTools.length} tools`);
    return { tools: allTools };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    logger.info(`Executing tool: ${name}`);
    logger.debug(`Tool arguments: ${JSON.stringify(args)}`);

    try {
      // Verify API key is configured
      if (!config.apiKey) {
        throw new ConfigurationError(
          'ZERODRIVE_API_KEY environment variable is not set. Please configure it in your Claude Desktop settings.'
        );
      }

      const result = await executeTool(name, args ?? {});

      logger.info(`Tool ${name} executed successfully`);
      return formatSuccessResult(result);
    } catch (error) {
      return formatError(error);
    }
  });
}
