# ZeroDrive MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for ZeroDrive file management. This server enables AI assistants like Claude to interact with ZeroDrive cloud storage through a standardized interface.

## Features

- **28 MCP Tools** across 4 categories:
  - **File Operations** (8 tools): List, get, upload, download, move, share files
  - **Folder Operations** (7 tools): Create, list, update, delete, move, share folders
  - **Workspace Operations** (10 tools): Manage collaborative workspaces with files and folders
  - **Trash Operations** (3 tools): List, restore, and empty trash

- **Production-Ready**:
  - Zod validation for all inputs
  - Structured logging with pino
  - Comprehensive error handling
  - TypeScript with strict mode

## Requirements

- Node.js 22.0.0 or higher
- ZeroDrive API key

## Installation

```bash
# Clone the repository
git clone https://github.com/futurixai/zerodrive-mcp-server.git
cd zerodrive-mcp-server

# Install dependencies
npm install

# Build
npm run build
```

## Configuration

Set the required environment variable:

```bash
export ZERODRIVE_API_KEY="your-api-key-here"
```

Optional environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `ZERODRIVE_BASE_URL` | `https://drive.futurixai.com` | API base URL |
| `LOG_LEVEL` | `info` | Log level (trace, debug, info, warn, error, fatal, silent) |
| `NODE_ENV` | `production` | Environment mode |

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "zerodrive": {
      "command": "node",
      "args": ["/path/to/zerodrive-mcp-server/dist/index.js"],
      "env": {
        "ZERODRIVE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### File Tools

| Tool | Description |
|------|-------------|
| `list_files` | List files with filtering, pagination, and sorting |
| `get_file` | Get detailed file metadata |
| `upload_file` | Upload a file from local path |
| `download_file` | Generate download URL for a file |
| `generate_signed_url` | Generate time-limited signed URL |
| `fetch_file_content` | Fetch text content of a file |
| `move_file` | Move file to different folder |
| `share_file` | Share file with other users |

### Folder Tools

| Tool | Description |
|------|-------------|
| `list_folders` | List folders with filtering and pagination |
| `create_folder` | Create a new folder |
| `get_folder` | Get folder details |
| `update_folder` | Update folder properties |
| `delete_folder` | Delete folder (to trash or permanent) |
| `move_folder` | Move folder to different parent |
| `share_folder` | Share folder with other users |

### Workspace Tools

| Tool | Description |
|------|-------------|
| `list_workspaces` | List all accessible workspaces |
| `create_workspace` | Create a new workspace |
| `get_workspace` | Get workspace details |
| `upload_workspace_file` | Upload file to workspace |
| `list_workspace_files` | List files in workspace |
| `list_workspace_folders` | List folders in workspace |
| `create_workspace_folder` | Create folder in workspace |
| `get_workspace_folder` | Get workspace folder details |
| `update_workspace_folder` | Update workspace folder |
| `delete_workspace_folder` | Delete workspace folder |

### Trash Tools

| Tool | Description |
|------|-------------|
| `list_trash` | List trashed items |
| `restore_from_trash` | Restore item from trash |
| `empty_trash` | Permanently delete all trashed items |

## Development

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Build
npm run build

# Run linting
npm run lint

# Run tests
npm test

# Format code
npm run format
```

### Project Structure

```
src/
├── index.ts              # Entry point
├── api/                  # HTTP client layer
│   ├── client.ts         # API client with auth
│   └── endpoints.ts      # API endpoint constants
├── config/               # Configuration
│   ├── env.ts            # Environment validation
│   └── constants.ts      # Application constants
├── errors/               # Error handling
│   └── base.ts           # Error classes
├── logging/              # Structured logging
│   └── logger.ts         # Pino logger setup
├── schemas/              # Zod validation schemas
│   ├── common.ts         # Shared schemas
│   ├── files.ts          # File tool schemas
│   ├── folders.ts        # Folder tool schemas
│   ├── workspaces.ts     # Workspace tool schemas
│   └── trash.ts          # Trash tool schemas
├── server/               # MCP server setup
│   ├── server.ts         # Server creation
│   └── handlers.ts       # Request handlers
├── tools/                # Tool implementations
│   ├── files/            # File tools
│   ├── folders/          # Folder tools
│   ├── workspaces/       # Workspace tools
│   ├── trash/            # Trash tools
│   └── registry.ts       # Tool dispatcher
├── types/                # TypeScript types
│   ├── entities.ts       # Domain types
│   └── api.ts            # API types
└── utils/                # Utilities
    ├── query-builder.ts  # URL query builder
    ├── request-builder.ts # Request body builder
    ├── upload-handler.ts # File upload logic
    └── response-formatter.ts # Response formatting
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
