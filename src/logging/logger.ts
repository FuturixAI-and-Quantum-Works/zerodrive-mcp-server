/**
 * Structured logging with pino
 * Outputs to stderr to avoid interfering with MCP stdio communication
 */

import pino, { type Logger, type LoggerOptions } from 'pino';

/**
 * Log context for structured logging
 */
export interface LogContext {
  /** Tool name being executed */
  tool?: string;
  /** Operation being performed */
  operation?: string;
  /** Request duration in milliseconds */
  durationMs?: number;
  /** File ID involved in operation */
  fileId?: string;
  /** Folder ID involved in operation */
  folderId?: string;
  /** Workspace ID involved in operation */
  workspaceId?: string;
  /** Error code if applicable */
  errorCode?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Request ID for tracing */
  requestId?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Get log level from environment
 */
function getLogLevel(): string {
  return process.env['LOG_LEVEL'] ?? 'info';
}

/**
 * Create pino logger
 */
function createPinoLogger(): Logger {
  const isProduction = process.env['NODE_ENV'] === 'production';
  const isTest = process.env['NODE_ENV'] === 'test';

  const options: LoggerOptions = {
    name: 'zerodrive-mcp-server',
    level: isTest ? 'silent' : getLogLevel(),
  };

  // In production, output JSON to stderr for log aggregation
  if (isProduction) {
    return pino(options, pino.destination(2));
  }

  // In development, use pretty printing to stderr
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      destination: 2, // stderr
    },
  };

  return pino(options);
}

/**
 * Root logger instance
 */
let rootLogger: Logger | null = null;

/**
 * Get or create the root logger
 */
function getRootLogger(): Logger {
  if (!rootLogger) {
    rootLogger = createPinoLogger();
  }
  return rootLogger;
}

/**
 * Main logger export
 */
export const logger = {
  /**
   * Log trace level message
   */
  trace(msg: string, context?: LogContext): void {
    getRootLogger().trace(context ?? {}, msg);
  },

  /**
   * Log debug level message
   */
  debug(msg: string, context?: LogContext): void {
    getRootLogger().debug(context ?? {}, msg);
  },

  /**
   * Log info level message
   */
  info(msg: string, context?: LogContext): void {
    getRootLogger().info(context ?? {}, msg);
  },

  /**
   * Log warn level message
   */
  warn(msg: string, context?: LogContext): void {
    getRootLogger().warn(context ?? {}, msg);
  },

  /**
   * Log error level message
   */
  error(msg: string, context?: LogContext): void {
    getRootLogger().error(context ?? {}, msg);
  },

  /**
   * Log fatal level message
   */
  fatal(msg: string, context?: LogContext): void {
    getRootLogger().fatal(context ?? {}, msg);
  },
};

/**
 * Create a child logger with bound context
 * Useful for tool-specific logging
 *
 * @param context Base context to bind to all log messages
 * @returns Child logger with bound context
 */
export function createChildLogger(context: LogContext): typeof logger {
  const childPino = getRootLogger().child(context);

  return {
    trace(msg: string, additionalContext?: LogContext): void {
      childPino.trace(additionalContext ?? {}, msg);
    },
    debug(msg: string, additionalContext?: LogContext): void {
      childPino.debug(additionalContext ?? {}, msg);
    },
    info(msg: string, additionalContext?: LogContext): void {
      childPino.info(additionalContext ?? {}, msg);
    },
    warn(msg: string, additionalContext?: LogContext): void {
      childPino.warn(additionalContext ?? {}, msg);
    },
    error(msg: string, additionalContext?: LogContext): void {
      childPino.error(additionalContext ?? {}, msg);
    },
    fatal(msg: string, additionalContext?: LogContext): void {
      childPino.fatal(additionalContext ?? {}, msg);
    },
  };
}

/**
 * Log tool execution with timing
 *
 * @param toolName Name of the tool being executed
 * @param fn Async function to execute
 * @returns Result of the function
 */
export async function logToolExecution<T>(toolName: string, fn: () => Promise<T>): Promise<T> {
  const startTime = Date.now();
  const toolLogger = createChildLogger({ tool: toolName });

  toolLogger.debug('Tool execution started');

  try {
    const result = await fn();
    const durationMs = Date.now() - startTime;
    toolLogger.info('Tool execution completed', { durationMs });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startTime;
    toolLogger.error('Tool execution failed', {
      durationMs,
      errorCode: error instanceof Error ? error.name : 'UnknownError',
    });
    throw error;
  }
}

/**
 * Reset logger instance (useful for testing)
 */
export function resetLogger(): void {
  rootLogger = null;
}
