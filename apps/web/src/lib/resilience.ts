import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('resilience');

import { createClient } from '@supabase/supabase-js';

// Retry configuration
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  jitter: true
};

// Circuit breaker configuration
interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeout: 30000, // 30 seconds
  monitoringPeriod: 60000 // 1 minute
};

// Circuit breaker states
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = DEFAULT_CIRCUIT_BREAKER_CONFIG) {
    this.config = config;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }
}

// Retry with exponential backoff
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === finalConfig.maxAttempts) {
        throw lastError;
      }

      const delay = calculateDelay(attempt, finalConfig);
      await sleep(delay);
    }
  }

  throw lastError!;
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  delay = Math.min(delay, config.maxDelay);
  
  if (config.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }
  
  return Math.floor(delay);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Circuit breaker instances for different services
export const circuitBreakers = {
  supabase: new CircuitBreaker(),
  stripe: new CircuitBreaker(),
  openai: new CircuitBreaker(),
  resend: new CircuitBreaker()
};

// Resilient Supabase client wrapper
export function createResilientSupabaseClient(url: string, key: string) {
  const client = createClient(url, key);
  
  return {
    ...client,
    from: (table: string) => {
      const originalFrom = client.from(table);
      
      return {
        ...originalFrom,
        select: (columns?: string) => {
          const originalSelect = originalFrom.select(columns);
          
          return {
            ...originalSelect,
            then: (onFulfilled?: any, onRejected?: any) => {
              return circuitBreakers.supabase.execute(() =>
                withRetry(() => Promise.resolve(originalSelect).then(onFulfilled, onRejected))
              );
            }
          };
        },
        insert: (values: any) => {
          const originalInsert = originalFrom.insert(values);
          
          return {
            ...originalInsert,
            then: (onFulfilled?: any, onRejected?: any) => {
              return circuitBreakers.supabase.execute(() =>
                withRetry(() => Promise.resolve(originalInsert).then(onFulfilled, onRejected))
              );
            }
          };
        },
        update: (values: any) => {
          const originalUpdate = originalFrom.update(values);
          
          return {
            ...originalUpdate,
            then: (onFulfilled?: any, onRejected?: any) => {
              return circuitBreakers.supabase.execute(() =>
                withRetry(() => Promise.resolve(originalUpdate).then(onFulfilled, onRejected))
              );
            }
          };
        },
        delete: () => {
          const originalDelete = originalFrom.delete();
          
          return {
            ...originalDelete,
            then: (onFulfilled?: any, onRejected?: any) => {
              return circuitBreakers.supabase.execute(() =>
                withRetry(() => Promise.resolve(originalDelete).then(onFulfilled, onRejected))
              );
            }
          };
        }
      };
    }
  };
}

// Health check for circuit breakers
export function getCircuitBreakerHealth() {
  return {
    supabase: {
      state: circuitBreakers.supabase.getState(),
      failureCount: circuitBreakers.supabase.getFailureCount()
    },
    stripe: {
      state: circuitBreakers.stripe.getState(),
      failureCount: circuitBreakers.stripe.getFailureCount()
    },
    openai: {
      state: circuitBreakers.openai.getState(),
      failureCount: circuitBreakers.openai.getFailureCount()
    },
    resend: {
      state: circuitBreakers.resend.getState(),
      failureCount: circuitBreakers.resend.getFailureCount()
    }
  };
}

// Utility for handling transient errors
export function isTransientError(error: any): boolean {
  if (!error) return false;
  
  const message = error.message?.toLowerCase() || '';
  const code = error.code?.toLowerCase() || '';
  
  // Network errors
  if (message.includes('network') || 
      message.includes('timeout') || 
      message.includes('connection') ||
      message.includes('econnreset') ||
      message.includes('enotfound')) {
    return true;
  }
  
  // HTTP status codes
  if (error.status >= 500 || error.status === 429) {
    return true;
  }
  
  // Supabase specific errors
  if (code === 'PGRST301' || code === 'PGRST302') {
    return true;
  }
  
  return false;
}

// Graceful degradation utilities
export function withGracefulDegradation<T, R>(
  operation: () => Promise<T>,
  fallback: () => R,
  isTransient: (error: any) => boolean = isTransientError
): Promise<T | R> {
  return operation().catch(error => {
    if (isTransient(error)) {
      if (process.env.NODE_ENV === 'development') { _logger.warn('Operation failed, using fallback:', { error: error.message }); }
      return fallback();
    }
    throw error;
  });
}