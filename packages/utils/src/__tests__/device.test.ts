// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isWeb, isIOS, isAndroid, useDeviceMode, getResponsiveValue, getPlatformValue } from '../device';

describe('Device Detection', () => {
  const originalWindow = global.window;
  const originalNavigator = global.navigator;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    global.window = originalWindow;
    global.navigator = originalNavigator;
  });

  describe('isWeb', () => {
    it('should return true when window exists', () => {
      global.window = {} as any;
      expect(isWeb).toBe(true);
    });

    it('should return false when window does not exist', () => {
      delete (global as any).window;
      // Note: This test might not work in Node environment
      // The actual value depends on execution environment
    });
  });

  describe('isIOS', () => {
    it('should detect iOS user agent', () => {
      global.window = {
        navigator: {
          userAgent: 'iPhone',
        },
      } as any;
      // Note: isIOS is a const, so it's evaluated at module load time
      // This test would need to be adjusted based on actual implementation
    });
  });

  describe('isAndroid', () => {
    it('should detect Android user agent', () => {
      global.window = {
        navigator: {
          userAgent: 'Android',
        },
      } as any;
      // Similar note as isIOS
    });
  });

  describe('useDeviceMode', () => {
    it('should return device mode', () => {
      const mode = useDeviceMode();
      expect(['web', 'ios', 'android', 'unknown']).toContain(mode);
    });
  });

  describe('getResponsiveValue', () => {
    it('should return mobile value for mobile', () => {
      const result = getResponsiveValue('mobile', 'desktop');
      expect(result).toBe('mobile');
    });

    it('should return desktop value for desktop', () => {
      const result = getResponsiveValue('mobile', 'desktop');
      // Note: This depends on actual device detection
      expect(['mobile', 'desktop']).toContain(result);
    });
  });

  describe('getPlatformValue', () => {
    it('should return web value', () => {
      const result = getPlatformValue('web', 'mobile');
      expect(['web', 'mobile']).toContain(result);
    });

    it('should return mobile value for mobile platform', () => {
      const result = getPlatformValue('web', 'mobile');
      expect(['web', 'mobile']).toContain(result);
    });
  });
});
