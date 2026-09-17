// @ts-nocheck
/**
 * Retry Utility with Exponential Backoff
 *
 * Provides configurable retry logic for external API calls and database operations.
 * Implements exponential backoff to avoid overwhelming failing services.
 */
export class RetryableError extends Error {
    retryable;
    originalError;
    constructor(message, retryable = true, originalError) {
        super(message);
        this.retryable = retryable;
        this.originalError = originalError;
        this.name = 'RetryableError';
    }
}
/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt, initialDelayMs, maxDelayMs, multiplier, jitter) {
    const exponentialDelay = initialDelayMs * Math.pow(multiplier, attempt - 1);
    const delay = Math.min(exponentialDelay, maxDelayMs);
    // Add jitter to prevent thundering herd
    const jitterAmount = delay * jitter * Math.random();
    return Math.floor(delay + jitterAmount);
}
/**
 * Check if error is retryable
 */
function isRetryableError(error, isRetryable) {
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
        const httpError = error;
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
export async function retry(fn, options = {}) {
    const { maxAttempts = 3, initialDelayMs = 1000, maxDelayMs = 30000, multiplier = 2, jitter = 0.1, isRetryable: customIsRetryable, timeoutMs = 30000, onRetry, } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Add timeout to each attempt
            if (timeoutMs > 0) {
                return await Promise.race([
                    fn(),
                    new Promise((_, reject) => {
                        setTimeout(() => {
                            reject(new RetryableError(`Operation timed out after ${timeoutMs}ms`, true));
                        }, timeoutMs);
                    }),
                ]);
            }
            return await fn();
        }
        catch (error) {
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
    failureThreshold;
    resetTimeoutMs;
    halfOpenMaxAttempts;
    failures = 0;
    lastFailureTime = 0;
    state = 'closed';
    constructor(failureThreshold = 5, resetTimeoutMs = 60000, halfOpenMaxAttempts = 1) {
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.halfOpenMaxAttempts = halfOpenMaxAttempts;
    }
    async execute(fn) {
        // Check if circuit should be reset
        if (this.state === 'open') {
            const timeSinceLastFailure = Date.now() - this.lastFailureTime;
            if (timeSinceLastFailure > this.resetTimeoutMs) {
                this.state = 'half-open';
                this.failures = 0;
            }
            else {
                throw new RetryableError('Circuit breaker is open', false);
            }
        }
        try {
            const result = await fn();
            // Success: reset failures
            if (this.state === 'half-open') {
                this.state = 'closed';
                this.failures = 0;
            }
            else {
                this.failures = 0;
            }
            return result;
        }
        catch (error) {
            this.failures++;
            this.lastFailureTime = Date.now();
            // Open circuit if threshold exceeded
            if (this.failures >= this.failureThreshold) {
                this.state = 'open';
            }
            else if (this.state === 'half-open' && this.failures >= this.halfOpenMaxAttempts) {
                this.state = 'open';
            }
            throw error;
        }
    }
    getState() {
        return this.state;
    }
    reset() {
        this.state = 'closed';
        this.failures = 0;
        this.lastFailureTime = 0;
    }
}
/**
 * Retry with circuit breaker
 */
export async function retryWithCircuitBreaker(fn, circuitBreaker, retryOptions = {}) {
    return retry(() => circuitBreaker.execute(fn), retryOptions);
}
