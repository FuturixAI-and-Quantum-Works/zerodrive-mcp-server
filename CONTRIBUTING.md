# Contributing to ZeroDrive MCP Server

Thank you for your interest in contributing to ZeroDrive MCP Server! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributions from everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/zerodrive-mcp-server.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 22.0.0 or higher
- npm or bun package manager

### Environment

Create a `.env` file for local development:

```bash
ZERODRIVE_API_KEY=your-test-api-key
ZERODRIVE_BASE_URL=https://drive.futurixai.com
LOG_LEVEL=debug
NODE_ENV=development
```

### Commands

```bash
# Type checking
npm run typecheck

# Build
npm run build

# Lint
npm run lint

# Format
npm run format

# Test
npm test

# Test with coverage
npm run test:coverage
```

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/). Each commit message must follow this format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(files): add support for file versioning
fix(upload): handle large file uploads correctly
docs: update README with new configuration options
```

## Pull Request Process

1. Ensure your code passes all checks:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   ```

2. Update documentation if needed

3. Create a pull request with:
   - Clear title following conventional commits
   - Description of changes
   - Link to related issues

4. Wait for review and address feedback

## Code Style

- Use TypeScript strict mode
- Follow existing code patterns
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Use meaningful variable names

## Testing

- Write tests for new features
- Maintain test coverage above 80%
- Use descriptive test names
- Test edge cases

## Project Structure

When adding new features:

- Tool definitions go in `src/tools/<category>/definitions.ts`
- Tool handlers go in `src/tools/<category>/handlers.ts`
- Validation schemas go in `src/schemas/<category>.ts`
- New API endpoints go in `src/api/endpoints.ts`

## Questions?

Open an issue for questions or discussions about contributing.
