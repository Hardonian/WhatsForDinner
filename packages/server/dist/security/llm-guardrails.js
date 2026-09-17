// @ts-nocheck
/**
 * AI Agent Guardrails
 */
import { createComponentLogger } from '@whats-for-dinner/utils';
const logger = createComponentLogger('llm-guardrails-ts');
export class LLMGuardrails {
    circuitBreakerOpen = false;
    failureCount = 0;
    failureThreshold = 5;
    resetTimeout = 60000;
    async callLLM(llmFunction, options = {}) {
        const { timeout = 30000, maxRetries = 3, schema, circuitBreaker = true, } = options;
        if (circuitBreaker && this.circuitBreakerOpen) {
            throw new Error('Circuit breaker is open');
        }
        let lastError = null;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await Promise.race([
                    llmFunction(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
                ]);
                if (schema) {
                    const validated = schema.parse(result);
                    this.resetCircuitBreaker();
                    return validated;
                }
                this.resetCircuitBreaker();
                return result;
            }
            catch (error) {
                lastError = error;
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
    recordFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.openCircuitBreaker();
        }
    }
    openCircuitBreaker() {
        this.circuitBreakerOpen = true;
        setTimeout(() => {
            this.resetCircuitBreaker();
        }, this.resetTimeout);
    }
    resetCircuitBreaker() {
        this.circuitBreakerOpen = false;
        this.failureCount = 0;
    }
    async callWithFallback(llmFunction, fallbackFunction, options = {}) {
        try {
            return await this.callLLM(llmFunction, options);
        }
        catch (error) {
            if (process.env.NODE_ENV === 'development') {
                logger.warn('LLM failed', { message: 'using fallback', error });
            }
            return fallbackFunction();
        }
    }
}
export const llmGuardrails = new LLMGuardrails();
