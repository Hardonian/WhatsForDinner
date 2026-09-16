// @ts-nocheck
/**
 * Retry Utility with Exponential Backoff
 * 
 * Provides configurable retry logic for external API calls and database operations.
 * Implements exponential backoff to avoid overwhelming failing services.
 */

export interface RetryOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxAttempts?: number;
  
  /**
   * Initial delay in milliseconds (default: 1000)
   */
  initialDelayMs?: number;
  
  /**
   * Maximum delay in milliseconds (default: 30000)
   */
  maxDelayMs?: number;
  
  /**
   * Exponential backoff multiplier (default: 2)
   */
  multiplier?: number;
  
  /**
   * Jitter factor (0-1) to add randomness to delays (default: 0.1)
   */
  jitter?: number;
  
  /**
   * Function to determine if error is retryable (default: retries all errors)
   */
  isRetryable?: (error: unknown) => boolean;
  
  /**
   * Timeout in milliseconds for each attempt (default: 30000)
   */
  timeoutMs?: number;
  
  /**
   * Callback before each retry attempt
   */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = true,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  multiplier: number,
  jitter: number
): number {
  const exponentialDelay = initialDelayMs * Math.pow(multiplier, attempt - 1);
  const delay = Math.min(exponentialDelay, maxDelayMs);
  
  // Add jitter to prevent thundering herd
  const jitterAmount = delay * jitter * Math.random();
  return Math.floor(delay + jitterAmount);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown, isRetryable?: (error: unknown) => boolean): boolean {
  if (isRetryable) {
    return isRetryable(error);
  }
  
  // Default: retry network errors, timeouts, and 5xx errors
  if (error instanceof RetryableError) {
    return error.retryable;
  }
  
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('ECONNREFUSED') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('ENOTFOUND')) {
      return true;
    }
  }
  
  // HTTP errors (if error has status property)
  if (typeof error === 'object' && error !== null) {
    const httpError = error as { status?: number; statusCode?: number };
    const status = httpError.status || httpError.statusCode;
    
    // Retry 5xx errors and 429 (rate limit)
    if (status && (status >= 500 || status === 429)) {
      return true;
    }
    
    // Don't retry 4xx errors (except 429)
    if (status && status >= 400 && status < 500 && status !== 429) {
      return false;
    }
  }
  
  return true;
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    multiplier = 2,
    jitter = 0.1,
    isRetryable: customIsRetryable,
    timeoutMs = 30000,
    onRetry,
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Add timeout to each attempt
      if (timeoutMs > 0) {
        return await Promise.race([
          fn(),
          new Promise<T>((_, reject) => {
            setTimeout(() => {
              reject(new RetryableError(`Operation timed out after ${timeoutMs}ms`, true));
            }, timeoutMs);
          }),
        ]);
      }
      
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if error is retryable
      if (!isRetryableError(error, customIsRetryable)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt >= maxAttempts) {
        throw error;
      }
      
      // Calculate delay
      const delayMs = calculateDelay(attempt, initialDelayMs, maxDelayMs, multiplier, jitter);
      
      // Callback before retry
      if (onRetry) {
        onRetry(attempt, error, delayMs);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw lastError;
}

/**
 * Retry with circuit breaker pattern
 * Prevents retrying when service is consistently failing
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000,
    private readonly halfOpenMaxAttempts: number = 1
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.resetTimeoutMs) {
        this.state = 'half-open';
        this.failures = 0;
      } else {
        throw new RetryableError('Circuit breaker is open', false);
      }
    }
    
    try {
      const result = await fn();
      
      // Success: reset failures
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      } else {
        this.failures = 0;
      }
      
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      
      // Open circuit if threshold exceeded
      if (this.failures >= this.failureThreshold) {
        this.state = 'open';
      } else if (this.state === 'half-open' && this.failures >= this.halfOpenMaxAttempts) {
        this.state = 'open';
      }
      
      throw error;
    }
  }
  
  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }
  
  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Retry with circuit breaker
 */
export async function retryWithCircuitBreaker<T>(
  fn: () => Promise<T>,
  circuitBreaker: CircuitBreaker,
  retryOptions: RetryOptions = {}
): Promise<T> {
  return retry(
    () => circuitBreaker.execute(fn),
    retryOptions
  );
}
