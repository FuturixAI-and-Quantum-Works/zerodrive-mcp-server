/**
 * Configuration-related types
 */

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  /** ZeroDrive API key */
  apiKey: string;
  /** Base URL for API */
  baseUrl: string;
  /** Log level */
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'silent';
  /** Node environment */
  nodeEnv: 'development' | 'production' | 'test';
}

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Server name */
  name: string;
  /** Server version */
  version: string;
  /** Enabled capabilities */
  capabilities: ServerCapabilities;
}

/**
 * Server capabilities
 */
export interface ServerCapabilities {
  /** Tool capabilities */
  tools?: Record<string, unknown>;
  /** Resource capabilities */
  resources?: Record<string, unknown>;
  /** Prompt capabilities */
  prompts?: Record<string, unknown>;
}

/**
 * Tool definition
 */
export interface ToolDefinition {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Input schema (JSON Schema) */
  inputSchema: JsonSchema;
}

/**
 * JSON Schema type
 */
export interface JsonSchema {
  /** Schema type */
  type: 'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null';
  /** Object properties */
  properties?: Record<string, JsonSchemaProperty>;
  /** Required property names */
  required?: string[];
  /** Array items schema */
  items?: JsonSchemaProperty;
  /** Additional properties allowed */
  additionalProperties?: boolean;
}

/**
 * JSON Schema property
 */
export interface JsonSchemaProperty {
  /** Property type */
  type: string | string[];
  /** Property description */
  description?: string;
  /** Enum values */
  enum?: (string | number | boolean)[];
  /** Default value */
  default?: unknown;
  /** Minimum value */
  minimum?: number;
  /** Maximum value */
  maximum?: number;
  /** Pattern for string validation */
  pattern?: string;
  /** Array items schema */
  items?: JsonSchemaProperty;
}
