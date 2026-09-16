import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('error-boundaries');

/**
 * Error Boundaries
 * 
 * Utilities for wrapping functions with error boundaries to prevent
 * errors from propagating and provide graceful degradation.
 */

import { AppError, InternalError, isAppError } from './errors';

/**
 * Wrap an async function with error boundary handling
 * 
 * @param fn - Function to wrap
 * @param errorHandler - Optional error handler (for logging, etc.)
 * @param fallback - Optional fallback value to return on error
 * @returns Wrapped function that catches errors
 * 
 * @example
 * ```ts
 * const safeFetch = withErrorBoundary(
 *   async (url: string) => fetch(url).then(r => r.json()),
 *   (error) => _logger.error('Fetch failed:', { error: error instanceof Error ? error.message : String(error) }),
 *   null // fallback value
 * );
 * ```
 */
export function withErrorBoundary<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  errorHandler?: (error: unknown, ...args: Parameters<T>) => void,
  fallback?: Awaited<ReturnType<T>>
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error, ...args);
      }

      // If fallback provided, return it instead of rethrowing
      if (fallback !== undefined) {
        return fallback;
      }

      // Re-throw AppErrors as-is
      if (isAppError(error)) {
        throw error;
      }

      // Wrap unknown errors
      throw new InternalError(
        `Error in ${fn.name || 'anonymous function'}`,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }) as T;
}

/**
 * Wrap a synchronous function with error boundary handling
 */
export function withErrorBoundarySync<T extends (...args: unknown[]) => any>(
  fn: T,
  errorHandler?: (error: unknown, ...args: Parameters<T>) => void,
  fallback?: ReturnType<T>
): T {
  return ((...args: Parameters<T>) => {
    try {
      return fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error, ...args);
      }

      if (fallback !== undefined) {
        return fallback;
      }

      if (isAppError(error)) {
        throw error;
      }

      throw new InternalError(
        `Error in ${fn.name || 'anonymous function'}`,
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  }) as T;
}

/**
 * Fire-and-forget wrapper for non-critical operations
 * Errors are logged but don't propagate
 * 
 * @param fn - Async function to execute
 * @param errorHandler - Error handler (defaults to console.error)
 * 
 * @example
 * ```ts
 * fireAndForget(async () => {
 *   await trackAnalytics(event);
 * }, (error) => _logger.error('Analytics failed', error));
 * ```
 */
export function fireAndForget(
  fn: () => Promise<void>,
  errorHandler?: (error: unknown) => void
): void {
  fn().catch((error) => {
    if (errorHandler) {
      errorHandler(error);
    } else {
      _logger.error('Fire-and-forget error:', { error: error instanceof Error ? error.message : String(error) });
    }
  });
}

/**
 * Retry wrapper with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Result of function execution
 * 
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => fetchExternalAPI(),
 *   { maxAttempts: 3, baseDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if shouldRetry returns false
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Circuit breaker pattern for external service calls
 * Prevents cascading failures by opening circuit after failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private options: {
      failureThreshold?: number;
      resetTimeout?: number;
      halfOpenMaxAttempts?: number;
    } = {}
  ) {
    this.options = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      halfOpenMaxAttempts: 3,
      ...options,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout!) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === 'half-open') {
      this.state = 'closed';
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.failureThreshold!) {
      this.state = 'open';
    }
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }
}
