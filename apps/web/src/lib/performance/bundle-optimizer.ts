/**
 * Bundle Optimization Utilities
 * 
 * Provides utilities for optimizing bundle size and code splitting
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('bundle-optimizer');

/**
 * Lazy load component with loading state
 * 
 * @param importFn - Function that imports the component
 * @param fallback - Fallback component to show while loading
 * @returns Lazy-loaded component
 * 
 * @example
 * ```tsx
 * const HeavyComponent = lazyLoad(
 *   () => import('./HeavyComponent'),
 *   () => <div>Loading...</div>
 * );
 * ```
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): React.LazyExoticComponent<T> {
  return React.lazy(importFn);
}

/**
 * Dynamic import with error boundary
 * 
 * @param importFn - Function that imports the module
 * @returns Promise resolving to the module
 */
export async function dynamicImport<T>(
  importFn: () => Promise<T>
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    _logger.error('Dynamic import failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Preload module for faster subsequent loads
 * 
 * @param importFn - Function that imports the module
 */
export function preloadModule<T>(
  importFn: () => Promise<T>
): void {
  // Preload in background
  importFn().catch(error => {
    _logger.warn('Module preload failed', {
      error: error instanceof Error ? error.message : String(error),
    });
  });
}

/**
 * Check if module is already loaded
 * 
 * @param moduleName - Name of the module
 * @returns true if module is loaded
 */
export function isModuleLoaded(moduleName: string): boolean {
  // Simplified check - in real implementation would check webpack chunks
  return typeof window !== 'undefined' && (window as any).__LOADED_MODULES__?.includes(moduleName);
}

/**
 * Track loaded modules for analysis
 */
export function trackModuleLoad(moduleName: string): void {
  if (typeof window !== 'undefined') {
    if (!(window as any).__LOADED_MODULES__) {
      (window as any).__LOADED_MODULES__ = [];
    }
    (window as any).__LOADED_MODULES__.push(moduleName);
  }
}
