#!/usr/bin/env node
/**
 * ZeroDrive MCP Server
 *
 * A Model Context Protocol server for ZeroDrive file management.
 * Provides 28 tools for files, folders, workspaces, and trash operations.
 *
 * @module zerodrive-mcp-server
 */

import { run } from './server/index.js';

// Start the server
void run();
