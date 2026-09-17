// @ts-nocheck
/**
 * Configuration Utilities
 *
 * Provides type-safe configuration loading with validation and defaults.
 * Centralizes configuration management across the application.
 */
import { z } from 'zod';
/**
 * Environment configuration schema
 */
export const envSchema = z.object({
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    // OpenAI
    OPENAI_API_KEY: z.string().min(1).optional(),
    // App
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    // Feature Flags
    FEATURE_FLAGS_ENABLED: z.string().transform(val => val === 'true').default('false'),
    // Retry Configuration
    RETRY_MAX_ATTEMPTS: z.string().transform(Number).default('3'),
    RETRY_INITIAL_DELAY_MS: z.string().transform(Number).default('1000'),
    RETRY_MAX_DELAY_MS: z.string().transform(Number).default('30000'),
    // Timeout Configuration
    API_TIMEOUT_MS: z.string().transform(Number).default('30000'),
    DATABASE_TIMEOUT_MS: z.string().transform(Number).default('10000'),
    // Rate Limiting
    RATE_LIMIT_ENABLED: z.string().transform(val => val === 'true').default('true'),
    RATE_LIMIT_REQUESTS_PER_MINUTE: z.string().transform(Number).default('60'),
    // Monitoring
    ENABLE_MONITORING: z.string().transform(val => val === 'true').default('true'),
    SENTRY_DSN: z.string().url().optional(),
    // Security
    ADMIN_BASIC_AUTH: z.string().optional(),
    PREVIEW_REQUIRE_AUTH: z.string().transform(val => val !== 'false').default('true'),
});
let cachedConfig = null;
/**
 * Load and validate configuration
 */
export function loadConfig() {
    if (cachedConfig) {
        return cachedConfig;
    }
    // Validate environment variables
    const env = envSchema.parse(process.env);
    // Build configuration
    cachedConfig = {
        env,
        features: {
            enabled: env.FEATURE_FLAGS_ENABLED,
        },
        retry: {
            maxAttempts: env.RETRY_MAX_ATTEMPTS,
            initialDelayMs: env.RETRY_INITIAL_DELAY_MS,
            maxDelayMs: env.RETRY_MAX_DELAY_MS,
            multiplier: 2,
            jitter: 0.1,
        },
        timeouts: {
            api: env.API_TIMEOUT_MS,
            database: env.DATABASE_TIMEOUT_MS,
        },
        rateLimiting: {
            enabled: env.RATE_LIMIT_ENABLED,
            requestsPerMinute: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
        },
        monitoring: {
            enabled: env.ENABLE_MONITORING,
            sentryDsn: env.SENTRY_DSN,
        },
    };
    return cachedConfig;
}
/**
 * Get configuration (cached)
 */
export function getConfig() {
    return loadConfig();
}
/**
 * Reset cached configuration (useful for testing)
 */
export function resetConfig() {
    cachedConfig = null;
}
/**
 * Get feature flag value
 */
export function getFeatureFlag(flag) {
    const config = getConfig();
    if (!config.features.enabled) {
        return false;
    }
    // Check environment variable first
    const envValue = process.env[`FEATURE_${flag.toUpperCase()}`];
    if (envValue !== undefined) {
        return envValue === 'true';
    }
    // Check feature flags object
    return config.features[flag] === true;
}
/**
 * Check if running in production
 */
export function isProduction() {
    return getConfig().env.NODE_ENV === 'production';
}
/**
 * Check if running in development
 */
export function isDevelopment() {
    return getConfig().env.NODE_ENV === 'development';
}
/**
 * Check if running in test
 */
export function isTest() {
    return getConfig().env.NODE_ENV === 'test';
}
