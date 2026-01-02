# Changelog

## 1.0.1

### Patch Changes

- [`8565830`](https://github.com/FuturixAI-and-Quantum-Works/zerodrive-mcp-server/commit/8565830d6bf4d2c3f371ef07389f1a21a959a75e) Thanks [@Aqua-123](https://github.com/Aqua-123)! - Fix startup error when running via npx by adding pino-pretty as a production dependency

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-12-01

### Added

- Modular architecture with feature-based tool organization
- Zod validation for all tool inputs
- Structured logging with pino
- Comprehensive error handling with typed errors
- TypeScript strict mode configuration
- ESLint and Prettier configuration
- Husky pre-commit hooks
- Conventional commit enforcement
- GitHub Actions CI pipeline

### Changed

- Refactored from single 1,497-line file to modular structure
- Upgraded to Node.js 22 LTS requirement
- Enhanced TypeScript configuration with stricter settings
- Improved API client with retry logic and better error handling

### Fixed

- Eliminated ~23% code duplication through utility extraction
- Consolidated upload logic for personal and workspace files

## [1.0.0] - 2024-11-01

### Added

- Initial release with 28 MCP tools
- File management (list, get, upload, download, move, share)
- Folder management (create, list, update, delete, move, share)
- Workspace management with collaborative features
- Trash management (list, restore, empty)
