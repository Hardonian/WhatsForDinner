// @ts-nocheck
/**
 * AI Agent Guardrails
 */

import { z } from 'zod';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('llm-guardrails-ts');
export interface LLMCallOptions {
  timeout?: number;
  maxRetries?: number;
  schema?: z.ZodSchema;
  circuitBreaker?: boolean;
}

export class LLMGuardrails {
  private circuitBreakerOpen = false;
  private failureCount = 0;
  private readonly failureThreshold = 5;
  private readonly resetTimeout = 60000;

  async callLLM<T>(
    llmFunction: () => Promise<T>,
    options: LLMCallOptions = {}
  ): Promise<T> {
    const {
      timeout = 30000,
      maxRetries = 3,
      schema,
      circuitBreaker = true,
    } = options;

    if (circuitBreaker && this.circuitBreakerOpen) {
      throw new Error('Circuit breaker is open');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          llmFunction(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
          ),
        ]);

        if (schema) {
          const validated = schema.parse(result);
          this.resetCircuitBreaker();
          return validated as T;
        }

        this.resetCircuitBreaker();
        return result;
      } catch (error) {
        lastError = error as Error;
        this.recordFailure();
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    if (circuitBreaker) {
      this.openCircuitBreaker();
    }

    throw lastError || new Error('LLM call failed');
  }

  private recordFailure() {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.openCircuitBreaker();
    }
  }

  private openCircuitBreaker() {
    this.circuitBreakerOpen = true;
    setTimeout(() => {
      this.resetCircuitBreaker();
    }, this.resetTimeout);
  }

  private resetCircuitBreaker() {
    this.circuitBreakerOpen = false;
    this.failureCount = 0;
  }

  async callWithFallback<T>(
    llmFunction: () => Promise<T>,
    fallbackFunction: () => T,
    options: LLMCallOptions = {}
  ): Promise<T> {
    try {
      return await this.callLLM(llmFunction, options);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { logger.warn('LLM failed', { message: 'using fallback', error }); }
      return fallbackFunction();
    }
  }
}

export const llmGuardrails = new LLMGuardrails();
