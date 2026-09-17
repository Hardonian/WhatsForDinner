/**
 * React Performance Optimization Utilities
 * Provides memoization, lazy loading, and performance hooks
 */

import React, { useMemo, useCallback, memo, type ComponentType, type ReactNode } from 'react';

/**
 * Memoized component wrapper with display name
 */
export function memoized<T extends ComponentType<any>>(
  Component: T,
  displayName?: string
): T {
  const Memoized = memo(Component) as unknown as T;
  if (displayName) {
    (Memoized as any).displayName = displayName;
  }
  return Memoized;
}

/**
 * Hook for memoizing expensive computations
 */
export function useExpensiveValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return useMemo(factory, deps);
}

/**
 * Hook for memoizing callbacks
 */
export function useStableCallback<T extends (...args: unknown[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

/**
 * Hook for conditional rendering optimization
 */
export function useConditionalRender(
  condition: boolean,
  component: ReactNode,
  fallback: ReactNode = null
): ReactNode {
  return useMemo(
    () => (condition ? component : fallback),
    [condition, component, fallback]
  );
}

/**
 * Hook for debounced values
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  return useMemo(() => {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    
    React.useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }, [value, delay]);
}

/**
 * Hook for throttled values
 */
export function useThrottledValue<T>(value: T, limit: number): T {
  return useMemo(() => {
    const [throttledValue, setThrottledValue] = React.useState(value);
    const lastRan = React.useRef(Date.now());

    React.useEffect(() => {
      const handler = setTimeout(() => {
        if (Date.now() - lastRan.current >= limit) {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }
      }, limit - (Date.now() - lastRan.current));

      return () => {
        clearTimeout(handler);
      };
    }, [value, limit]);

    return throttledValue;
  }, [value, limit]);
}
