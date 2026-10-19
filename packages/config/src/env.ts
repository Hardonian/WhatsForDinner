/**
 * Comprehensive Environment Variable Validation
 * Validates all environment variables using Zod schema
 * Covers all variables from .env.example
 */

import { z } from 'zod';
import { createComponentLogger } from '@whats-for-dinner/utils';

/**
 * Environment variable schema
 * All required and optional env vars are defined here
 */
const logger = createComponentLogger('env-ts');
const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test', 'staging']).default('development'),
  
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),
  SUPABASE_PROJECT_REF: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),
  
  // Prisma configuration
  PRISMA_CLIENT_ENGINE_TYPE: z.enum(['wasm', 'binary']).default('wasm'),
  
  // App configuration
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'production', 'staging']).default('production'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  CORS_ORIGINS: z.string().optional(),
  
  // OAuth configuration
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // Storage/signing
  NEXT_PUBLIC_UPLOAD_BUCKET: z.string().default('public'),
  SIGNING_SECRET: z.string().min(32).optional(),
  
  // Redis configuration
  REDIS_URL: z.string().url().optional(),
  
  // Queue configuration
  QUEUE_CONCURRENCY: z.string().regex(/^\d+$/).transform(Number).default('5'),
  QUEUE_NAME: z.string().default('default'),
  
  // Webhook secrets
  WEBHOOK_SECRET_PARTNER: z.string().min(32).optional(),
  WEBHOOK_SECRET_PAYMENTS: z.string().min(32).optional(),
  
  // OpenAI configuration
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),
  OPENAI_MAX_TOKENS: z.string().regex(/^\d+$/).transform(Number).default('2000'),
  OPENAI_TEMPERATURE: z.string().regex(/^\d+\.?\d*$/).transform(Number).default('0.7'),
  
  // Email configuration
  SENDGRID_API_KEY: z.string().startsWith('SG.').optional(),
  SENDER_EMAIL: z.string().email().optional(),
  CRM_PROVIDER: z.enum(['sendgrid', 'klaviyo', 'noop']).default('noop'),
  SENDGRID_FROM: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  KLAVIYO_API_KEY: z.string().optional(),
  KLAVIYO_LIST_ID: z.string().optional(),
  
  // Deep links
  BRANCH_OR_DEEPLINK_BASE: z.string().url().optional(),
  
  // Feature flags
  EXPERIMENTS_KILL_SWITCH: z.string().transform(val => val === 'true').default('false'),
  EXPERIMENT_CONFIG_PATH: z.string().optional(),
  
  // Stripe configuration
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  
  // Partner Revenue Network
  CONNECT_PLATFORM_FEE_PCT: z.string().regex(/^\d+\.?\d*$/).transform(Number).default('0.10'),
  AFFILIATE_DEFAULT_SHARE_PCT: z.string().regex(/^\d+\.?\d*$/).transform(Number).default('0.10'),
  LINK_SIGNING_SECRET: z.string().min(32).optional(),
  EXCHANGE_RATE_API_KEY: z.string().optional(),
  GEOIP_LICENSE_KEY: z.string().optional(),
  PARTNER_CONVERSION_HMAC_SECRET: z.string().min(32).optional(),
  ATTRIBUTION_WINDOW_DAYS: z.string().regex(/^\d+$/).transform(Number).default('7'),
  
  // Observability - OpenTelemetry
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default('nomad-backend'),
  ENABLE_OTLP: z.string().transform(val => val === 'true').default('true'),
  
  // Backend mode
  BACKEND_MODE: z.enum(['next', 'fastify']).default('next'),
  
  // Analytics & Monitoring
  NEXT_PUBLIC_GA_ID: z.string().regex(/^G-[A-Z0-9]+$/).optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().startsWith('ph_').optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
  NEXT_PUBLIC_CLARITY_ID: z.string().optional(),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  
  // Media & Upload Services
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  NEXT_PUBLIC_CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY: z.string().optional(),
  
  // Realtime & Live Features
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  NEXT_PUBLIC_PUSHER_CLUSTER: z.string().optional(),
  NEXT_PUBLIC_ABLY_KEY: z.string().optional(),
  
  // Search & Recommendations
  NEXT_PUBLIC_ALGOLIA_APP_ID: z.string().optional(),
  NEXT_PUBLIC_ALGOLIA_SEARCH_KEY: z.string().optional(),
  ALGOLIA_ADMIN_KEY: z.string().optional(),
  NEXT_PUBLIC_MEILI_HOST: z.string().url().optional(),
  NEXT_PUBLIC_MEILI_KEY: z.string().optional(),
  
  // Security & Bot Protection
  NEXT_PUBLIC_HCAPTCHA_SITEKEY: z.string().optional(),
  HCAPTCHA_SECRET: z.string().optional(),
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
  
  // Chat & Support
  NEXT_PUBLIC_TIDIO_KEY: z.string().optional(),
  NEXT_PUBLIC_CRISP_ID: z.string().optional(),
  
  // Commerce & Payments
  NEXT_PUBLIC_LEMONSQUEEZY_STORE: z.string().optional(),
  LEMONSQUEEZY_API_KEY: z.string().optional(),
  
  // Trust & Reviews
  NEXT_PUBLIC_TRUSTPILOT_BUSINESS_ID: z.string().optional(),
  
  // Monetization Configuration
  AFFILIATE_ENABLED: z.string().transform(val => val === 'true').default('false'),
  AFFILIATE_COMMISSION_RATE: z.string().regex(/^\d+$/).transform(Number).optional(),
  AFFILIATE_MIN_PAYOUT: z.string().regex(/^\d+$/).transform(Number).optional(),
  API_MONETIZATION_ENABLED: z.string().transform(val => val === 'true').default('false'),
  DATA_INSIGHTS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  MARKETPLACE_ENABLED: z.string().transform(val => val === 'true').default('false'),
  MARKETPLACE_COMMISSION_RATE: z.string().regex(/^\d+$/).transform(Number).optional(),
  AUTOMATED_UPSELLS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  CRON_SECRET: z.string().min(32).optional(),
  
  // RegTech Layer Configuration
  PRIVACY_OFFICER_EMAIL: z.string().email().optional(),
  DSAR_VERIFICATION_JWT_SECRET: z.string().min(32).optional(),
  ARTIFACTS_BUCKET_URL: z.string().optional(),
  ARTIFACTS_BUCKET_SIGNING_KEY: z.string().min(32).optional(),
  EVIDENCE_IMMUTABLE_BUCKET_URL: z.string().optional(),
  MAGIC_LINK_BASE_URL: z.string().url().optional(),
  CCM_ALERT_WEBHOOK: z.string().url().optional(),
  LEGAL_HOLD_DEFAULT: z.string().transform(val => val === 'true').default('false'),
  DSAR_DEADLINE_DAYS: z.string().regex(/^\d+$/).transform(Number).default('30'),
  ADMIN_JWT_SECRET: z.string().min(32).optional(),
  ADMIN_JWT_EXPIRY: z.string().default('8h'),
  
  // Observability & Monitoring
  PROMETHEUS_URL: z.string().url().optional(),
  GRAFANA_URL: z.string().url().optional(),
  LOKI_URL: z.string().url().optional(),
  TEMPO_URL: z.string().url().optional(),
  PROMETHEUS_PORT: z.string().regex(/^\d+$/).transform(Number).default('9464'),
  ENABLE_PROMETHEUS: z.string().transform(val => val === 'true').default('true'),
  
  // Alerting
  PAGERDUTY_API_KEY: z.string().optional(),
  SLACK_ALERT_WEBHOOK: z.string().url().optional(),
  
  // Backup & Disaster Recovery
  BACKUP_BUCKET_URL: z.string().optional(),
  BACKUP_ENCRYPTION_KEY: z.string().min(32).optional(),
  BACKUP_RETENTION_DAYS: z.string().regex(/^\d+$/).transform(Number).default('30'),
  
  // Failover & DNS
  FAILOVER_DNS_ZONE_ID: z.string().optional(),
  
  // Chaos Engineering
  CHAOS_ENABLED: z.string().transform(val => val === 'true').default('false'),
  
  // Performance Testing
  PERF_THRESHOLD_PCT: z.string().regex(/^\d+$/).transform(Number).default('10'),
  BASE_URL: z.string().url().optional(),
  
  // Self-Healing
  MAX_QUERY_DURATION_MS: z.string().regex(/^\d+$/).transform(Number).default('30000'),
  ENABLE_AUTO_ROLLBACK: z.string().transform(val => val === 'true').default('false'),
  
  // System Configuration
  SYSTEM_USER_ID: z.string().default('system'),
  
  // Container Signing
  COSIGN_PRIVATE_KEY: z.string().optional(),
  
  // Dependency Tracking
  DEPENDENCY_TRACK_API_KEY: z.string().optional(),
  DEPENDENCY_TRACK_URL: z.string().url().optional(),
  
  // Vercel configuration
  VERCEL_TOKEN: z.string().optional(),
  VERCEL_ORG_ID: z.string().optional(),
  VERCEL_PROJECT_ID: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  
  // Admin configuration
  ADMIN_BASIC_AUTH: z.string().optional(),
  CSP_MODE: z.enum(['strict', 'balanced', 'loose']).default('balanced'),
  NEXT_PUBLIC_IMAGE_DOMAINS: z.string().optional(),
  PREVIEW_REQUIRE_AUTH: z.string().transform(val => val !== 'false').default('true'),
  
  // Development
  npm_package_version: z.string().optional(),
});

/**
 * Validated environment variables
 * Throws error if validation fails
 */
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .filter(e => e.code === 'invalid_type' && e.received === 'undefined')
        .map(e => e.path.join('.'));
      
      const invalid = error.errors
        .filter(e => e.code !== 'invalid_type' || e.received !== 'undefined')
        .map(e => `${e.path.join('.')}: ${e.message}`);
      
      logger.error('❌ Environment variable validation failed:');
      if (missing.length > 0) {
        logger.error('   Missing required variables:', { missing: missing.join(', ') });
      }
      if (invalid.length > 0) {
        logger.error('   Invalid variables:', { invalid: invalid.join(', ') });
      }
      
      throw new Error(`Environment validation failed: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get validated environment variables
 * Returns typed env object
 * Uses lazy validation - only validates when accessed
 */
let _env: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

/**
 * Lazy getter for environment variables
 * Validates on first access, caches result
 */
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_target, prop: string | symbol) {
    const envObj = getEnv();
    return envObj[prop as keyof typeof envObj];
  },
  ownKeys() {
    return Object.keys(getEnv());
  },
  getOwnPropertyDescriptor(_target, prop: string | symbol) {
    const envObj = getEnv();
    return {
      enumerable: true,
      configurable: true,
      value: envObj[prop as keyof typeof envObj],
    };
  },
});

/**
 * Type for environment variables
 */
export type Env = z.infer<typeof envSchema>;
