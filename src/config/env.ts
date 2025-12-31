/**
 * Environment configuration with Zod validation
 * Fails fast on missing required configuration
 */

import { z } from 'zod';

/**
 * Environment variable schema with validation
 */
const envSchema = z.object({
  /** ZeroDrive API key for authentication (required) */
  ZERODRIVE_API_KEY: z.string().min(1, 'ZERODRIVE_API_KEY is required'),

  /** Base URL for the ZeroDrive API */
  ZERODRIVE_BASE_URL: z.string().url().default('https://drive.futurixai.com'),

  /** Log level for pino logger */
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),

  /** Node environment */
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
});

/**
 * Parsed and validated configuration type
 */
export type Config = z.infer<typeof envSchema>;

/**
 * Cached configuration instance
 */
let cachedConfig: Config | null = null;

/**
 * Load and validate environment configuration
 * @throws {Error} If required environment variables are missing or invalid
 * @returns Validated configuration object
 */
export function loadConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const result = envSchema.safeParse({
    ZERODRIVE_API_KEY: process.env['ZERODRIVE_API_KEY'],
    ZERODRIVE_BASE_URL: process.env['ZERODRIVE_BASE_URL'],
    LOG_LEVEL: process.env['LOG_LEVEL'],
    NODE_ENV: process.env['NODE_ENV'],
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration validation failed:\n${errors}`);
  }

  cachedConfig = result.data;
  return cachedConfig;
}

/**
 * Get a specific configuration value
 * @param key Configuration key
 * @returns Configuration value
 */
export function getConfig<K extends keyof Config>(key: K): Config[K] {
  const config = loadConfig();
  return config[key];
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return loadConfig().NODE_ENV === 'development';
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return loadConfig().NODE_ENV === 'production';
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  return loadConfig().NODE_ENV === 'test';
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetConfig(): void {
  cachedConfig = null;
}
