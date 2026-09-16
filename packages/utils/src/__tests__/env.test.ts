// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  requireEnv,
  requireEnvArray,
  optionalEnv,
  validateEnv,
} from '../env';

describe('requireEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return environment variable value when present', () => {
    process.env.TEST_KEY = 'test-value';
    expect(requireEnv('TEST_KEY')).toBe('test-value');
  });

  it('should return default value when provided and env var missing', () => {
    delete process.env.TEST_KEY;
    expect(requireEnv('TEST_KEY', 'default-value')).toBe('default-value');
  });

  it('should throw error when env var missing and no default', () => {
    delete process.env.TEST_KEY;
    expect(() => requireEnv('TEST_KEY')).toThrow('Missing required environment variable: TEST_KEY');
  });

  it('should handle empty string as missing', () => {
    process.env.TEST_KEY = '';
    expect(() => requireEnv('TEST_KEY')).toThrow('Missing required environment variable: TEST_KEY');
  });
});

describe('requireEnvArray', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return all required env vars', () => {
    process.env.KEY1 = 'value1';
    process.env.KEY2 = 'value2';
    
    const result = requireEnvArray(['KEY1', 'KEY2']);
    expect(result).toEqual({
      KEY1: 'value1',
      KEY2: 'value2',
    });
  });

  it('should throw error if any env var is missing', () => {
    process.env.KEY1 = 'value1';
    delete process.env.KEY2;
    
    expect(() => requireEnvArray(['KEY1', 'KEY2'])).toThrow('Missing required environment variable: KEY2');
  });
});

describe('optionalEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return env var value when present', () => {
    process.env.OPTIONAL_KEY = 'optional-value';
    expect(optionalEnv('OPTIONAL_KEY')).toBe('optional-value');
  });

  it('should return default when env var missing', () => {
    delete process.env.OPTIONAL_KEY;
    expect(optionalEnv('OPTIONAL_KEY', 'default')).toBe('default');
  });

  it('should return empty string when no default provided', () => {
    delete process.env.OPTIONAL_KEY;
    expect(optionalEnv('OPTIONAL_KEY')).toBe('');
  });
});

describe('validateEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should not throw when all required vars are present', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    
    expect(() => validateEnv()).not.toThrow();
  });

  it('should throw when required vars are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    expect(() => validateEnv()).toThrow(/Missing required environment variables/);
  });

  it('should list all missing vars in error', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    try {
      validateEnv();
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(error.message).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
  });
});
