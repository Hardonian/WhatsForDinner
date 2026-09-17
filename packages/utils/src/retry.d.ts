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
export declare class RetryableError extends Error {
    readonly retryable: boolean;
    readonly originalError?: unknown | undefined;
    constructor(message: string, retryable?: boolean, originalError?: unknown | undefined);
}
/**
 * Retry a function with exponential backoff
 */
export declare function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Retry with circuit breaker pattern
 * Prevents retrying when service is consistently failing
 */
export declare class CircuitBreaker {
    private readonly failureThreshold;
    private readonly resetTimeoutMs;
    private readonly halfOpenMaxAttempts;
    private failures;
    private lastFailureTime;
    private state;
    constructor(failureThreshold?: number, resetTimeoutMs?: number, halfOpenMaxAttempts?: number);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    getState(): 'closed' | 'open' | 'half-open';
    reset(): void;
}
/**
 * Retry with circuit breaker
 */
export declare function retryWithCircuitBreaker<T>(fn: () => Promise<T>, circuitBreaker: CircuitBreaker, retryOptions?: RetryOptions): Promise<T>;
//# sourceMappingURL=retry.d.ts.map