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
    /**
     * Sanitizes user input to prevent prompt injection and escapes control tokens.
     */
    sanitizePrompt(input) {
        if (!input || typeof input !== 'string')
            return '';
        const sanitized = input
            .replace(/<\/?(?:system|user|assistant|instruction|prompt)[^>]*>/gi, '')
            .replace(/(?:ignore previous instructions|ignore all previous directions|system prompt)/gi, '[FILTERED]')
            .trim();
        return `<user_input>${sanitized}</user_input>`;
    }
    /**
     * Deterministically scans an array of recipe ingredients against a user allergen blacklist.
     */
    scanAllergens(ingredients, blacklist) {
        if (!ingredients?.length || !blacklist?.length) {
            return { safe: true, violations: [] };
        }
        const stem = (word) => word.toLowerCase().trim().replace(/s$/i, '').replace(/ies$/i, 'y');
        const normalizedBlacklist = blacklist
            .map((b) => b.trim().toLowerCase())
            .filter(Boolean)
            .map((b) => ({ raw: b, stemmed: stem(b) }));
        const violations = [];
        for (const ingredient of ingredients) {
            const lowerIng = ingredient.toLowerCase();
            const words = lowerIng.split(/[\s,/-]+/).map(stem);
            for (const allergen of normalizedBlacklist) {
                if (lowerIng.includes(allergen.raw) ||
                    (allergen.stemmed.length >= 3 && lowerIng.includes(allergen.stemmed)) ||
                    words.includes(allergen.raw) ||
                    words.includes(allergen.stemmed)) {
                    violations.push(`${ingredient} contains allergen "${allergen.raw}"`);
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
