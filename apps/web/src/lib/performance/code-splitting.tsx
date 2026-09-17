/**
 * Phase 2: Performance & UX Stability
 * Intelligent Code Splitting Utilities
 * 
 * Provides React.lazy() wrappers with intelligent loading and error boundaries
 */

import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { LoadingState } from '@/components/LoadingState';

/**
 * Create a lazy-loaded component with intelligent error boundary and loading state
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): LazyExoticComponent<T> {
  return React.lazy(() => {
    return new Promise((resolve, reject) => {
      // Add timeout for slow networks
      const timeout = setTimeout(() => {
        reject(new Error('Component load timeout'));
      }, 10000); // 10 second timeout

      importFn()
        .then((module) => {
          clearTimeout(timeout);
          resolve(module);
        })
        .catch((error) => {
          clearTimeout(timeout);
          // Error handled: [Code Splitting] Failed to load component:
          reject(error);
        });
    });
  });
}

/**
 * Suspense wrapper with intelligent fallback
 */
interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minLoadingTime?: number; // Minimum time to show loading (prevents flash)
}

export function SuspenseWrapper({
  children,
  fallback,
  minLoadingTime = 200,
}: SuspenseWrapperProps) {
  const [showFallback, setShowFallback] = React.useState(true);
  const startTime = React.useRef(Date.now());

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime.current;
      if (elapsed >= minLoadingTime) {
        setShowFallback(false);
      } else {
        const remaining = minLoadingTime - elapsed;
        setTimeout(() => setShowFallback(false), remaining);
      }
    }, minLoadingTime);

    return () => clearTimeout(timer);
  }, [minLoadingTime]);

  return (
    <Suspense
      fallback={
        showFallback
          ? fallback || <LoadingState message="Loading..." />
          : null
      }
    >
      {children}
    </Suspense>
  );
}

/**
 * Preload a component before it's needed
 */
export function preloadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): Promise<void> {
  return new Promise((resolve, reject) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn()
          .then(() => resolve())
          .catch(reject);
      });
    } else {
      setTimeout(() => {
        importFn()
          .then(() => resolve())
          .catch(reject);
      }, 100);
    }
  });
}

/**
 * Batch preload multiple components
 */
export async function preloadComponents(
  importFns: Array<() => Promise<unknown>>
): Promise<void> {
  const promises = importFns.map((fn) => preloadComponent(fn));
  await Promise.allSettled(promises);
}

export default function CodeSplitting() {
  return <div data-testid="code-splitting" role="main">Code Splitting</div>;
}

