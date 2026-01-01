/**
 * Unit tests for RequestBodyBuilder utility
 */

import { describe, it, expect } from 'vitest';
import { RequestBodyBuilder, buildRequestBody } from '../../../src/utils/request-builder.js';
import { MissingRequiredFieldError } from '../../../src/errors/base.js';

describe('RequestBodyBuilder', () => {
  describe('setRequired', () => {
    it('should set required field', () => {
      const builder = new RequestBodyBuilder();
      builder.setRequired('name', 'test');

      expect(builder.build()).toEqual({ name: 'test' });
    });

    it('should throw for undefined value', () => {
      const builder = new RequestBodyBuilder();

      expect(() => builder.setRequired('name', undefined)).toThrow(MissingRequiredFieldError);
    });

    it('should throw for null value', () => {
      const builder = new RequestBodyBuilder();

      expect(() => builder.setRequired('name', null)).toThrow(MissingRequiredFieldError);
    });

    it('should include field name in error', () => {
      const builder = new RequestBodyBuilder();

      try {
        builder.setRequired('username', undefined);
      } catch (error) {
        expect(error).toBeInstanceOf(MissingRequiredFieldError);
        expect((error as MissingRequiredFieldError).message).toContain('username');
      }
    });

    it('should support chaining', () => {
      const result = new RequestBodyBuilder()
        .setRequired('name', 'test')
        .setRequired('type', 'file')
        .build();

      expect(result).toEqual({ name: 'test', type: 'file' });
    });
  });

  describe('setOptional', () => {
    it('should set optional field when defined', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptional('description', 'My description');

      expect(builder.build()).toEqual({ description: 'My description' });
    });

    it('should skip undefined value', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptional('description', undefined);

      expect(builder.build()).toEqual({});
    });

    it('should set null value', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptional('parentId', null);

      expect(builder.build()).toEqual({ parentId: null });
    });

    it('should set empty string', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptional('description', '');

      expect(builder.build()).toEqual({ description: '' });
    });

    it('should set false boolean', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptional('isStarred', false);

      expect(builder.build()).toEqual({ isStarred: false });
    });

    it('should set zero number', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptional('count', 0);

      expect(builder.build()).toEqual({ count: 0 });
    });
  });

  describe('setOptionalNullable', () => {
    it('should set value when defined', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptionalNullable('parentId', 'folder-123');

      expect(builder.build()).toEqual({ parentId: 'folder-123' });
    });

    it('should set null value', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptionalNullable('parentId', null);

      expect(builder.build()).toEqual({ parentId: null });
    });

    it('should skip undefined', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptionalNullable('parentId', undefined);

      expect(builder.build()).toEqual({});
    });
  });

  describe('setWithDefault', () => {
    it('should use provided value when defined', () => {
      const builder = new RequestBodyBuilder();
      builder.setWithDefault('role', 'editor', 'viewer');

      expect(builder.build()).toEqual({ role: 'editor' });
    });

    it('should use default when undefined', () => {
      const builder = new RequestBodyBuilder();
      builder.setWithDefault('role', undefined, 'viewer');

      expect(builder.build()).toEqual({ role: 'viewer' });
    });

    it('should use provided value even if falsy', () => {
      const builder = new RequestBodyBuilder();
      builder.setWithDefault('count', 0, 10);

      expect(builder.build()).toEqual({ count: 0 });
    });
  });

  describe('setRequiredMany', () => {
    it('should set multiple required fields', () => {
      const builder = new RequestBodyBuilder();
      builder.setRequiredMany({ name: 'test', type: 'file' });

      expect(builder.build()).toEqual({ name: 'test', type: 'file' });
    });

    it('should throw if any field is undefined', () => {
      const builder = new RequestBodyBuilder();

      expect(() => builder.setRequiredMany({ name: 'test', type: undefined })).toThrow(
        MissingRequiredFieldError
      );
    });
  });

  describe('setOptionalMany', () => {
    it('should set multiple optional fields', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptionalMany({
        description: 'My desc',
        color: '#FF5733',
      });

      expect(builder.build()).toEqual({
        description: 'My desc',
        color: '#FF5733',
      });
    });

    it('should skip undefined values', () => {
      const builder = new RequestBodyBuilder();
      builder.setOptionalMany({
        description: 'My desc',
        color: undefined,
      });

      expect(builder.build()).toEqual({ description: 'My desc' });
    });
  });

  describe('setIf', () => {
    it('should set field when condition is true', () => {
      const builder = new RequestBodyBuilder();
      builder.setIf(true, 'action', 'delete');

      expect(builder.build()).toEqual({ action: 'delete' });
    });

    it('should not set field when condition is false', () => {
      const builder = new RequestBodyBuilder();
      builder.setIf(false, 'action', 'delete');

      expect(builder.build()).toEqual({});
    });
  });

  describe('build', () => {
    it('should return copy of body', () => {
      const builder = new RequestBodyBuilder();
      builder.setRequired('name', 'test');

      const body1 = builder.build();
      const body2 = builder.build();

      expect(body1).toEqual(body2);
      expect(body1).not.toBe(body2);
    });
  });

  describe('buildJson', () => {
    it('should return JSON string', () => {
      const builder = new RequestBodyBuilder();
      builder.setRequired('name', 'test');

      expect(builder.buildJson()).toBe('{"name":"test"}');
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty builder', () => {
      const builder = new RequestBodyBuilder();

      expect(builder.isEmpty()).toBe(true);
    });

    it('should return false when fields exist', () => {
      const builder = new RequestBodyBuilder();
      builder.setRequired('name', 'test');

      expect(builder.isEmpty()).toBe(false);
    });
  });

  describe('hasFields', () => {
    it('should return false for empty builder', () => {
      const builder = new RequestBodyBuilder();

      expect(builder.hasFields()).toBe(false);
    });

    it('should return true when fields exist', () => {
      const builder = new RequestBodyBuilder();
      builder.setRequired('name', 'test');

      expect(builder.hasFields()).toBe(true);
    });
  });

  describe('static from', () => {
    it('should create builder from object', () => {
      const builder = RequestBodyBuilder.from({
        name: 'test',
        type: 'file',
      });

      expect(builder.build()).toEqual({ name: 'test', type: 'file' });
    });

    it('should skip undefined values', () => {
      const builder = RequestBodyBuilder.from({
        name: 'test',
        type: undefined,
      });

      expect(builder.build()).toEqual({ name: 'test' });
    });
  });

  describe('static forFolder', () => {
    it('should create builder for folder operations', () => {
      const builder = RequestBodyBuilder.forFolder({
        name: 'Documents',
        parentId: 'folder-123',
        description: 'My documents',
        color: '#FF5733',
        isStarred: true,
      });

      const body = builder.build();
      expect(body.name).toBe('Documents');
      expect(body.parentId).toBe('folder-123');
      expect(body.description).toBe('My documents');
      expect(body.color).toBe('#FF5733');
      expect(body.isStarred).toBe(true);
    });

    it('should handle null parentId', () => {
      const builder = RequestBodyBuilder.forFolder({
        name: 'Root Folder',
        parentId: null,
      });

      expect(builder.build().parentId).toBe(null);
    });

    it('should skip undefined fields', () => {
      const builder = RequestBodyBuilder.forFolder({
        name: 'Simple',
      });

      const body = builder.build();
      expect(body.name).toBe('Simple');
      expect(body).not.toHaveProperty('parentId');
      expect(body).not.toHaveProperty('description');
    });
  });

  describe('static forShare', () => {
    it('should create builder for share operations', () => {
      const builder = RequestBodyBuilder.forShare({
        emails: ['user@example.com'],
        role: 'editor',
        canShare: true,
        message: 'Please review',
      });

      const body = builder.build();
      expect(body.emails).toEqual(['user@example.com']);
      expect(body.role).toBe('editor');
      expect(body.canShare).toBe(true);
      expect(body.message).toBe('Please review');
    });

    it('should throw if emails is undefined', () => {
      expect(() =>
        RequestBodyBuilder.forShare({ emails: undefined as unknown as string[] })
      ).toThrow(MissingRequiredFieldError);
    });
  });

  describe('static forWorkspaceCreate', () => {
    it('should create builder for workspace creation', () => {
      const builder = RequestBodyBuilder.forWorkspaceCreate({
        name: 'Team Workspace',
        storageAllocation: 100 * 1024 * 1024,
        description: 'For the team',
        icon: 'folder',
        color: '#0000FF',
      });

      const body = builder.build();
      expect(body.name).toBe('Team Workspace');
      expect(body.storageAllocation).toBe(100 * 1024 * 1024);
      expect(body.description).toBe('For the team');
      expect(body.icon).toBe('folder');
      expect(body.color).toBe('#0000FF');
    });

    it('should throw if name is missing', () => {
      expect(() =>
        RequestBodyBuilder.forWorkspaceCreate({
          name: undefined as unknown as string,
          storageAllocation: 100 * 1024 * 1024,
        })
      ).toThrow(MissingRequiredFieldError);
    });

    it('should throw if storageAllocation is missing', () => {
      expect(() =>
        RequestBodyBuilder.forWorkspaceCreate({
          name: 'Test',
          storageAllocation: undefined as unknown as number,
        })
      ).toThrow(MissingRequiredFieldError);
    });
  });

  describe('static forMove', () => {
    it('should create builder for move to folder', () => {
      const builder = RequestBodyBuilder.forMove('folder-123');

      expect(builder.build()).toEqual({ folderId: 'folder-123' });
    });

    it('should create builder for move to root with null', () => {
      const builder = RequestBodyBuilder.forMove(null);

      expect(builder.build()).toEqual({ folderId: null });
    });

    it('should create builder for move to root with undefined', () => {
      const builder = RequestBodyBuilder.forMove(undefined);

      expect(builder.build()).toEqual({ folderId: null });
    });
  });
});

describe('buildRequestBody', () => {
  it('should build body with required fields', () => {
    const body = buildRequestBody({ name: 'test' });

    expect(body).toEqual({ name: 'test' });
  });

  it('should build body with required and optional fields', () => {
    const body = buildRequestBody({ name: 'test' }, { description: 'My desc' });

    expect(body).toEqual({ name: 'test', description: 'My desc' });
  });

  it('should skip undefined optional fields', () => {
    const body = buildRequestBody({ name: 'test' }, { description: undefined });

    expect(body).toEqual({ name: 'test' });
  });

  it('should throw if required field is undefined', () => {
    expect(() => buildRequestBody({ name: undefined })).toThrow(MissingRequiredFieldError);
  });
});
