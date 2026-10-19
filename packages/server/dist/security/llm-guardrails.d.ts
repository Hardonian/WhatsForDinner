/**
 * AI Agent Guardrails
 */
import { z } from 'zod';
export interface LLMCallOptions {
    timeout?: number;
    maxRetries?: number;
    schema?: z.ZodSchema;
    circuitBreaker?: boolean;
}
export declare class LLMGuardrails {
    private circuitBreakerOpen;
    private failureCount;
    private readonly failureThreshold;
    private readonly resetTimeout;
    callLLM<T>(llmFunction: () => Promise<T>, options?: LLMCallOptions): Promise<T>;
    private recordFailure;
    private openCircuitBreaker;
    private resetCircuitBreaker;
    callWithFallback<T>(llmFunction: () => Promise<T>, fallbackFunction: () => T, options?: LLMCallOptions): Promise<T>;
    /**
     * Sanitizes user input to prevent prompt injection and escapes control tokens.
     */
    sanitizePrompt(input: string): string;
    /**
     * Deterministically scans an array of recipe ingredients against a user allergen blacklist.
     */
    scanAllergens(ingredients: string[], blacklist: string[]): {
        safe: boolean;
        violations: string[];
    };
}
export declare const llmGuardrails: LLMGuardrails;
//# sourceMappingURL=llm-guardrails.d.ts.map