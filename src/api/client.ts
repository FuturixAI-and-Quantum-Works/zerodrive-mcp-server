/**
 * HTTP API client with authentication, logging, and error handling
 */

import { getConfig } from '../config/env.js';
import { HTTP_METHODS } from '../config/constants.js';
import {
  ApiError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  NetworkError,
  ValidationError,
  wrapError,
  isRetryableError,
} from '../errors/base.js';
import { logger } from '../logging/logger.js';
import type { ApiRequestOptions, ApiErrorResponse } from '../types/api.js';

/**
 * API client configuration
 */
interface ClientConfig {
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum retry attempts for retryable errors */
  maxRetries: number;
  /** Base delay for retry backoff in milliseconds */
  retryDelay: number;
}

const DEFAULT_CONFIG: ClientConfig = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * Make an API request with authentication
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const baseUrl = getConfig('ZERODRIVE_BASE_URL');
  const apiKey = getConfig('ZERODRIVE_API_KEY');

  const { method = HTTP_METHODS.GET, body, headers = {}, query, rawResponse = false } = options;

  // Build URL with query parameters
  let url = `${baseUrl}${endpoint}`;
  if (query) {
    const queryString = buildQueryString(query);
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Build headers
  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    ...headers,
  };

  // Add Content-Type for requests with body
  if (body && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Build request init
  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const startTime = Date.now();

  logger.debug('API request started', {
    operation: 'api_request',
    tool: method,
  });

  try {
    const response = await fetch(url, requestInit);
    const durationMs = Date.now() - startTime;

    logger.debug('API response received', {
      operation: 'api_request',
      statusCode: response.status,
      durationMs,
    });

    // Handle error responses
    if (!response.ok) {
      const error = await handleErrorResponse(response, endpoint);
      throw error;
    }

    // Return raw response if requested
    if (rawResponse) {
      return response as unknown as T;
    }

    // Parse response based on content type
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return (await response.json()) as T;
    }

    // Return text for non-JSON responses
    return (await response.text()) as unknown as T;
  } catch (error) {
    const durationMs = Date.now() - startTime;

    // Re-throw our custom errors
    if (error instanceof ApiError || error instanceof NetworkError) {
      logger.error('API request failed', {
        operation: 'api_request',
        errorCode: error.code,
        durationMs,
      });
      throw error;
    }

    // Wrap unknown errors
    logger.error('API request failed with unknown error', {
      operation: 'api_request',
      durationMs,
    });

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network request failed');
    }

    throw wrapError(error, `API request to ${endpoint} failed`);
  }
}

/**
 * Make a GET request
 */
export async function get<T = unknown>(
  endpoint: string,
  query?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return apiRequest<T>(endpoint, { method: HTTP_METHODS.GET, query });
}

/**
 * Make a POST request
 */
export async function post<T = unknown>(
  endpoint: string,
  body?: unknown,
  query?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return apiRequest<T>(endpoint, { method: HTTP_METHODS.POST, body, query });
}

/**
 * Make a PUT request
 */
export async function put<T = unknown>(
  endpoint: string,
  body?: unknown,
  query?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return apiRequest<T>(endpoint, { method: HTTP_METHODS.PUT, body, query });
}

/**
 * Make a PATCH request
 */
export async function patch<T = unknown>(
  endpoint: string,
  body?: unknown,
  query?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return apiRequest<T>(endpoint, { method: HTTP_METHODS.PATCH, body, query });
}

/**
 * Make a DELETE request
 */
export async function del<T = unknown>(
  endpoint: string,
  query?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return apiRequest<T>(endpoint, { method: HTTP_METHODS.DELETE, query });
}

/**
 * Handle error response and create appropriate error
 */
async function handleErrorResponse(response: Response, endpoint: string): Promise<never> {
  let errorBody: ApiErrorResponse | string;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      errorBody = (await response.json()) as ApiErrorResponse;
    } else {
      errorBody = await response.text();
    }
  } catch {
    errorBody = `HTTP ${response.status}`;
  }

  const message =
    typeof errorBody === 'object' ? errorBody.message : errorBody || `HTTP ${response.status}`;

  const context = {
    endpoint,
    statusCode: response.status,
    ...(typeof errorBody === 'object' && errorBody.errors ? { errors: errorBody.errors } : {}),
  };

  switch (response.status) {
    case 400:
      throw new ValidationError(message, context);

    case 401:
      throw new AuthenticationError(message, context);

    case 403:
      throw new AuthorizationError(message, context);

    case 404:
      throw new NotFoundError('Resource', undefined, context);

    case 429: {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError(retryAfter ? parseInt(retryAfter, 10) : undefined, context);
    }

    default:
      throw new ApiError(message, response.status, context);
  }
}

/**
 * Build query string from object
 */
function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  return searchParams.toString();
}

/**
 * Make request with retries for transient failures
 */
export async function apiRequestWithRetry<T = unknown>(
  endpoint: string,
  options: ApiRequestOptions = {},
  config: Partial<ClientConfig> = {}
): Promise<T> {
  const { maxRetries, retryDelay } = { ...DEFAULT_CONFIG, ...config };

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiRequest<T>(endpoint, options);
    } catch (error) {
      lastError = error;

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate backoff delay (exponential)
      const delay = retryDelay * Math.pow(2, attempt);

      logger.warn('API request failed, retrying', {
        operation: 'api_retry',
        errorCode: error instanceof Error ? error.name : 'unknown',
      });

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
