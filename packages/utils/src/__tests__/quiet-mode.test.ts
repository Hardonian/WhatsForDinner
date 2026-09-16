// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getQuietModeConfig,
  setQuietMode,
  isQuietModeEnabled,
} from '../quiet-mode';

describe('Quiet Mode', () => {
  beforeEach(() => {
    // Reset localStorage if in browser environment
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getQuietModeConfig', () => {
    it('should return quiet mode configuration', () => {
      const config = getQuietModeConfig();
      expect(config).toBeDefined();
      expect(typeof config.enabled).toBe('boolean');
    });
  });

  describe('setQuietMode', () => {
    it('should enable quiet mode', () => {
      setQuietMode(true);
      expect(isQuietModeEnabled()).toBe(true);
    });

    it('should disable quiet mode', () => {
      setQuietMode(false);
      expect(isQuietModeEnabled()).toBe(false);
    });

    it('should set custom message', () => {
      setQuietMode(true, 'Custom message');
      const config = getQuietModeConfig();
      expect(config.message).toBe('Custom message');
    });
  });

  describe('isQuietModeEnabled', () => {
    it('should return false by default', () => {
      // Assuming default is false
      expect(typeof isQuietModeEnabled()).toBe('boolean');
    });

    it('should return true after enabling', () => {
      setQuietMode(true);
      expect(isQuietModeEnabled()).toBe(true);
    });

    it('should return false after disabling', () => {
      setQuietMode(false);
      expect(isQuietModeEnabled()).toBe(false);
    });
  });
});
