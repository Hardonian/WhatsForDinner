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

  /**
   * Sanitizes user input to prevent prompt injection and escapes control tokens.
   */
  sanitizePrompt(input: string): string {
    if (!input || typeof input !== 'string') return '';
    const sanitized = input
      .replace(/<\/?(?:system|user|assistant|instruction|prompt)[^>]*>/gi, '')
      .replace(/(?:ignore previous instructions|ignore all previous directions|system prompt)/gi, '[FILTERED]')
      .trim();
    return `<user_input>${sanitized}</user_input>`;
  }

  /**
   * Deterministically scans an array of recipe ingredients against a user allergen blacklist.
   */
  scanAllergens(
    ingredients: string[],
    blacklist: string[]
  ): { safe: boolean; violations: string[] } {
    if (!ingredients?.length || !blacklist?.length) {
      return { safe: true, violations: [] };
    }

    const normalizedBlacklist = blacklist.map((b) => b.trim().toLowerCase()).filter(Boolean);
    const violations: string[] = [];

    for (const ingredient of ingredients) {
      const lowerIng = ingredient.toLowerCase();
      for (const allergen of normalizedBlacklist) {
        const regex = new RegExp(`\\b${allergen}\\b`, 'i');
        if (regex.test(lowerIng) || lowerIng.includes(allergen)) {
          violations.push(`${ingredient} contains allergen "${allergen}"`);
        }
      }
    }

    return {
      safe: violations.length === 0,
      violations: Array.from(new Set(violations)),
    };
  }
}

export const llmGuardrails = new LLMGuardrails();

