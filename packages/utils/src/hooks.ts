// @ts-nocheck
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDeviceMode } from './device';

// Cross-platform hook for device detection
export function useDeviceInfo() {
  const deviceMode = useDeviceMode();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (deviceMode.isWeb) {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [deviceMode.isWeb]);

  return {
    ...deviceMode,
    isOnline,
  };
}

// Hook for responsive values
export function useResponsiveValue<T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T {
  const { isWeb } = useDeviceMode();
  
  // In a real implementation, you'd use actual breakpoint detection
  // For now, return mobile for native, desktop for web
  return isWeb ? (desktop ?? tablet ?? mobile) : mobile;
}

// Hook for platform-specific styling
export function usePlatformStyles() {
  const { isIOS, isAndroid, isWeb } = useDeviceMode();

  return {
    safeAreaTop: isIOS ? 44 : isAndroid ? 24 : 0,
    safeAreaBottom: isIOS ? 34 : isAndroid ? 0 : 0,
    statusBarHeight: isIOS ? 44 : isAndroid ? 24 : 0,
    isWeb,
    isMobile: !isWeb,
  };
}

// Hook for pantry management
export function usePantry() {
  const [items, setItems] = useState<string[]>([]);

  const addItem = (item: string) => {
    setItems((prev: string[]) => [...prev, item]);
  };

  const removeItem = (index: number) => {
    setItems((prev: string[]) => prev.filter((_: string, i: number) => i !== index));
  };

  const clearItems = () => {
    setItems([]);
  };

  return {
    items,
    addItem,
    removeItem,
    clearItems,
  };
}

// Theme management hooks
export type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const { isWeb } = useDeviceMode();

  // Get system theme preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (isWeb && typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    // For React Native, you might want to use Appearance API
    return 'light';
  }, [isWeb]);

  // Update resolved theme based on current theme setting
  useEffect(() => {
    if (theme === 'system') {
      setResolvedTheme(getSystemTheme());
    } else {
      setResolvedTheme(theme);
    }
  }, [theme, getSystemTheme]);

  // Listen for system theme changes when using system mode
  useEffect(() => {
    if (theme === 'system' && isWeb && typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => setResolvedTheme(getSystemTheme());
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, isWeb, getSystemTheme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev: ThemeMode) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'system';
      return 'light';
    });
  }, []);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
  };
}

// Hook for syncing theme with NativeWind
export function useThemeSync() {
  const { resolvedTheme } = useTheme();
  const { isWeb } = useDeviceMode();

  useEffect(() => {
    if (isWeb) {
      // For web, apply theme class to document
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolvedTheme);
      }
    }
    // Note: React Native theme sync would be handled by the native app
  }, [resolvedTheme, isWeb]);
}

// Hook for theme-aware colors
export function useThemeColors() {
  const { isDark } = useTheme();
  
  return {
    background: isDark ? '#0f172a' : '#ffffff',
    foreground: isDark ? '#f8fafc' : '#0f172a',
    card: isDark ? '#1e293b' : '#ffffff',
    cardForeground: isDark ? '#f8fafc' : '#0f172a',
    popover: isDark ? '#1e293b' : '#ffffff',
    popoverForeground: isDark ? '#f8fafc' : '#0f172a',
    primary: isDark ? '#10b981' : '#10b981',
    primaryForeground: isDark ? '#ffffff' : '#ffffff',
    secondary: isDark ? '#334155' : '#f1f5f9',
    secondaryForeground: isDark ? '#f8fafc' : '#0f172a',
    muted: isDark ? '#334155' : '#f1f5f9',
    mutedForeground: isDark ? '#94a3b8' : '#64748b',
    accent: isDark ? '#334155' : '#f1f5f9',
    accentForeground: isDark ? '#f8fafc' : '#0f172a',
    destructive: isDark ? '#ef4444' : '#ef4444',
    destructiveForeground: isDark ? '#ffffff' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0',
    input: isDark ? '#334155' : '#e2e8f0',
    ring: isDark ? '#10b981' : '#10b981',
  };
}