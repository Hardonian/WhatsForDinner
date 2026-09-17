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
export declare const envSchema: z.ZodObject<{
    NEXT_PUBLIC_SUPABASE_URL: z.ZodString;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodOptional<z.ZodString>;
    OPENAI_API_KEY: z.ZodOptional<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    NEXT_PUBLIC_APP_URL: z.ZodOptional<z.ZodString>;
    FEATURE_FLAGS_ENABLED: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
    RETRY_MAX_ATTEMPTS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    RETRY_INITIAL_DELAY_MS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    RETRY_MAX_DELAY_MS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    API_TIMEOUT_MS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    DATABASE_TIMEOUT_MS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    RATE_LIMIT_ENABLED: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
    RATE_LIMIT_REQUESTS_PER_MINUTE: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    ENABLE_MONITORING: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
    SENTRY_DSN: z.ZodOptional<z.ZodString>;
    ADMIN_BASIC_AUTH: z.ZodOptional<z.ZodString>;
    PREVIEW_REQUIRE_AUTH: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "test" | "production";
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    FEATURE_FLAGS_ENABLED: boolean;
    RETRY_MAX_ATTEMPTS: number;
    RETRY_INITIAL_DELAY_MS: number;
    RETRY_MAX_DELAY_MS: number;
    API_TIMEOUT_MS: number;
    DATABASE_TIMEOUT_MS: number;
    RATE_LIMIT_ENABLED: boolean;
    RATE_LIMIT_REQUESTS_PER_MINUTE: number;
    ENABLE_MONITORING: boolean;
    PREVIEW_REQUIRE_AUTH: boolean;
    SUPABASE_SERVICE_ROLE_KEY?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    NEXT_PUBLIC_APP_URL?: string | undefined;
    SENTRY_DSN?: string | undefined;
    ADMIN_BASIC_AUTH?: string | undefined;
}, {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    SUPABASE_SERVICE_ROLE_KEY?: string | undefined;
    OPENAI_API_KEY?: string | undefined;
    NEXT_PUBLIC_APP_URL?: string | undefined;
    FEATURE_FLAGS_ENABLED?: string | undefined;
    RETRY_MAX_ATTEMPTS?: string | undefined;
    RETRY_INITIAL_DELAY_MS?: string | undefined;
    RETRY_MAX_DELAY_MS?: string | undefined;
    API_TIMEOUT_MS?: string | undefined;
    DATABASE_TIMEOUT_MS?: string | undefined;
    RATE_LIMIT_ENABLED?: string | undefined;
    RATE_LIMIT_REQUESTS_PER_MINUTE?: string | undefined;
    ENABLE_MONITORING?: string | undefined;
    SENTRY_DSN?: string | undefined;
    ADMIN_BASIC_AUTH?: string | undefined;
    PREVIEW_REQUIRE_AUTH?: string | undefined;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
/**
 * Application configuration
 */
export interface AppConfig {
    env: EnvConfig;
    features: FeatureFlags;
    retry: RetryConfig;
    timeouts: TimeoutConfig;
    rateLimiting: RateLimitConfig;
    monitoring: MonitoringConfig;
}
export interface FeatureFlags {
    enabled: boolean;
    [key: string]: unknown;
}
export interface RetryConfig {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    multiplier: number;
    jitter: number;
}
export interface TimeoutConfig {
    api: number;
    database: number;
}
export interface RateLimitConfig {
    enabled: boolean;
    requestsPerMinute: number;
}
export interface MonitoringConfig {
    enabled: boolean;
    sentryDsn?: string;
}
/**
 * Load and validate configuration
 */
export declare function loadConfig(): AppConfig;
/**
 * Get configuration (cached)
 */
export declare function getConfig(): AppConfig;
/**
 * Reset cached configuration (useful for testing)
 */
export declare function resetConfig(): void;
/**
 * Get feature flag value
 */
export declare function getFeatureFlag(flag: string): boolean;
/**
 * Check if running in production
 */
export declare function isProduction(): boolean;
/**
 * Check if running in development
 */
export declare function isDevelopment(): boolean;
/**
 * Check if running in test
 */
export declare function isTest(): boolean;
//# sourceMappingURL=config.d.ts.map