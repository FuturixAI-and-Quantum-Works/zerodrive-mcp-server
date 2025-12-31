/**
 * Configuration module exports
 */

import { loadConfig } from './env.js';

/**
 * Lazy-loaded configuration object
 * Provides convenient access to config values as properties
 */
export const config = {
  get apiKey(): string {
    return loadConfig().ZERODRIVE_API_KEY;
  },
  get baseUrl(): string {
    return loadConfig().ZERODRIVE_BASE_URL;
  },
  get logLevel(): string {
    return loadConfig().LOG_LEVEL;
  },
  get nodeEnv(): string {
    return loadConfig().NODE_ENV;
  },
};

export {
  loadConfig,
  getConfig,
  isDevelopment,
  isProduction,
  isTest,
  resetConfig,
  type Config,
} from './env.js';

export {
  SERVER_NAME,
  SERVER_VERSION,
  API_VERSION,
  API_BASE_PATH,
  HTTP_METHODS,
  DEFAULT_PAGINATION,
  SORT_FIELDS,
  SORT_ORDERS,
  SHARE_ROLES,
  SIGNED_URL_EXPIRY,
  UPLOAD_LIMITS,
  WORKSPACE_STORAGE,
  RESOURCE_TYPES,
  type HttpMethod,
  type SortField,
  type SortOrder,
  type ShareRole,
  type ResourceType,
} from './constants.js';
