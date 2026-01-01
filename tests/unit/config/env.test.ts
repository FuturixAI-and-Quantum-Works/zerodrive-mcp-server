/**
 * Unit tests for environment configuration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadConfig,
  getConfig,
  isDevelopment,
  isProduction,
  isTest,
  resetConfig,
} from '../../../src/config/env.js';

describe('Environment Configuration', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset config cache before each test
    resetConfig();
    // Clear environment variables
    delete process.env['ZERODRIVE_API_KEY'];
    delete process.env['ZERODRIVE_BASE_URL'];
    delete process.env['LOG_LEVEL'];
    delete process.env['NODE_ENV'];
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    resetConfig();
  });

  describe('loadConfig', () => {
    it('should load valid configuration', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['ZERODRIVE_BASE_URL'] = 'https://api.example.com';
      process.env['LOG_LEVEL'] = 'debug';
      process.env['NODE_ENV'] = 'development';

      const config = loadConfig();

      expect(config.ZERODRIVE_API_KEY).toBe('test-api-key');
      expect(config.ZERODRIVE_BASE_URL).toBe('https://api.example.com');
      expect(config.LOG_LEVEL).toBe('debug');
      expect(config.NODE_ENV).toBe('development');
    });

    it('should apply default values', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';

      const config = loadConfig();

      expect(config.ZERODRIVE_BASE_URL).toBe('https://drive.futurixai.com');
      expect(config.LOG_LEVEL).toBe('info');
      expect(config.NODE_ENV).toBe('production');
    });

    it('should throw for missing API key', () => {
      expect(() => loadConfig()).toThrow();
    });

    it('should throw for empty API key', () => {
      process.env['ZERODRIVE_API_KEY'] = '';

      expect(() => loadConfig()).toThrow();
    });

    it('should throw for invalid base URL', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['ZERODRIVE_BASE_URL'] = 'not-a-url';

      expect(() => loadConfig()).toThrow();
    });

    it('should throw for invalid log level', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['LOG_LEVEL'] = 'invalid';

      expect(() => loadConfig()).toThrow();
    });

    it('should throw for invalid node env', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'invalid';

      expect(() => loadConfig()).toThrow();
    });

    it('should cache configuration', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';

      const config1 = loadConfig();
      process.env['ZERODRIVE_API_KEY'] = 'different-key';
      const config2 = loadConfig();

      expect(config1).toBe(config2);
      expect(config2.ZERODRIVE_API_KEY).toBe('test-api-key');
    });

    it('should accept all valid log levels', () => {
      const levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'];

      for (const level of levels) {
        resetConfig();
        process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
        process.env['LOG_LEVEL'] = level;

        const config = loadConfig();
        expect(config.LOG_LEVEL).toBe(level);
      }
    });

    it('should accept all valid node environments', () => {
      const environments = ['development', 'production', 'test'];

      for (const env of environments) {
        resetConfig();
        process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
        process.env['NODE_ENV'] = env;

        const config = loadConfig();
        expect(config.NODE_ENV).toBe(env);
      }
    });

    it('should include helpful error message', () => {
      try {
        loadConfig();
        expect.fail('Expected error to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Configuration validation failed');
        expect((error as Error).message).toContain('ZERODRIVE_API_KEY');
      }
    });
  });

  describe('getConfig', () => {
    beforeEach(() => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['ZERODRIVE_BASE_URL'] = 'https://api.example.com';
      process.env['LOG_LEVEL'] = 'debug';
      process.env['NODE_ENV'] = 'test';
    });

    it('should get API key', () => {
      expect(getConfig('ZERODRIVE_API_KEY')).toBe('test-api-key');
    });

    it('should get base URL', () => {
      expect(getConfig('ZERODRIVE_BASE_URL')).toBe('https://api.example.com');
    });

    it('should get log level', () => {
      expect(getConfig('LOG_LEVEL')).toBe('debug');
    });

    it('should get node env', () => {
      expect(getConfig('NODE_ENV')).toBe('test');
    });
  });

  describe('isDevelopment', () => {
    it('should return true in development', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'development';

      expect(isDevelopment()).toBe(true);
    });

    it('should return false in production', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'production';

      expect(isDevelopment()).toBe(false);
    });

    it('should return false in test', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'test';

      expect(isDevelopment()).toBe(false);
    });
  });

  describe('isProduction', () => {
    it('should return true in production', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'production';

      expect(isProduction()).toBe(true);
    });

    it('should return false in development', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'development';

      expect(isProduction()).toBe(false);
    });

    it('should return false in test', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'test';

      expect(isProduction()).toBe(false);
    });
  });

  describe('isTest', () => {
    it('should return true in test', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'test';

      expect(isTest()).toBe(true);
    });

    it('should return false in production', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'production';

      expect(isTest()).toBe(false);
    });

    it('should return false in development', () => {
      process.env['ZERODRIVE_API_KEY'] = 'test-api-key';
      process.env['NODE_ENV'] = 'development';

      expect(isTest()).toBe(false);
    });
  });

  describe('resetConfig', () => {
    it('should clear cached configuration', () => {
      process.env['ZERODRIVE_API_KEY'] = 'first-key';
      const config1 = loadConfig();

      resetConfig();
      process.env['ZERODRIVE_API_KEY'] = 'second-key';
      const config2 = loadConfig();

      expect(config1.ZERODRIVE_API_KEY).toBe('first-key');
      expect(config2.ZERODRIVE_API_KEY).toBe('second-key');
    });
  });
});
