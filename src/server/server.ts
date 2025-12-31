/**
 * MCP Server setup and configuration
 *
 * Creates and configures the MCP server instance with all necessary
 * request handlers and transport.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { SERVER_NAME, SERVER_VERSION } from '../config/constants.js';
import { logger } from '../logging/index.js';
import { registerHandlers } from './handlers.js';

/**
 * Create and configure the MCP server
 */
export function createServer(): Server {
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register request handlers
  registerHandlers(server);

  logger.info(`Server created: ${SERVER_NAME} v${SERVER_VERSION}`);

  return server;
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  logger.info('ZeroDrive MCP Server running on stdio');
}

/**
 * Run the server (main entry point)
 */
export async function run(): Promise<void> {
  try {
    await startServer();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.fatal(`Fatal error starting server: ${message}`);
    process.exit(1);
  }
}
