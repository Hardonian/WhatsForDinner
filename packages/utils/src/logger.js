// @ts-nocheck
/**
 * Unified Logging Service
 *
 * Provides consistent logging across the monorepo with:
 * - Environment-aware log levels
 * - Structured logging
 * - Sentry integration
 * - Performance tracking
 * - Redaction of sensitive data
 */
/**
 * Sensitive fields to redact from logs
 */
const SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
    'creditCard',
    'ssn',
    'email', // Optional: uncomment if you want to redact emails
];
/**
 * Redact sensitive data from log context
 */
function redactSensitiveData(context) {
    const redacted = { ...context };
    for (const [key, value] of Object.entries(redacted)) {
        const lowerKey = key.toLowerCase();
        // Check if key contains sensitive field
        if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
            redacted[key] = '[REDACTED]';
            continue;
        }
        // Recursively redact nested objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            redacted[key] = redactSensitiveData(value);
        }
    }
    return redacted;
}
/**
 * Get current log level from environment
 */
function getLogLevel() {
    const envLevel = process.env.LOG_LEVEL?.toLowerCase();
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (envLevel && validLevels.includes(envLevel)) {
        return envLevel;
    }
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}
/**
 * Check if log level should be output
 */
function shouldLog(level, currentLevel) {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(currentLevel);
}
/**
 * Format log message with context
 */
function formatMessage(message, context, source, component) {
    const parts = [];
    if (source)
        parts.push(`[${source}]`);
    if (component)
        parts.push(`[${component}]`);
    parts.push(message);
    if (context && Object.keys(context).length > 0) {
        const contextStr = JSON.stringify(redactSensitiveData(context), null, 2);
        parts.push(`\nContext: ${contextStr}`);
    }
    return parts.join(' ');
}
/**
 * Create logger instance
 */
export function createLogger(source = 'app') {
    const currentLevel = getLogLevel();
    const isDevelopment = process.env.NODE_ENV === 'development';
    // Try to import Sentry if available
    let Sentry = null;
    try {
        // Dynamic import to avoid breaking if Sentry is not installed
        Sentry = null; // Stubbed for build
    }
    catch {
        // Sentry not available, continue without it
    }
    return {
        debug(message, context, sourceOverride, component) {
            if (!shouldLog('debug', currentLevel))
                return;
            const formatted = formatMessage(message, context, sourceOverride || source, component);
            if (isDevelopment) {
                console.debug(formatted);
            }
        },
        info(message, context, sourceOverride, component) {
            if (!shouldLog('info', currentLevel))
                return;
            const formatted = formatMessage(message, context, sourceOverride || source, component);
            if (isDevelopment) {
                console.info(formatted);
            }
            else {
                // In production, use structured logging
                console.info(JSON.stringify({
                    level: 'info',
                    message,
                    context: context ? redactSensitiveData(context) : undefined,
                    source: sourceOverride || source,
                    component,
                    timestamp: new Date().toISOString(),
                }));
            }
        },
        warn(message, context, sourceOverride, component) {
            if (!shouldLog('warn', currentLevel))
                return;
            const formatted = formatMessage(message, context, sourceOverride || source, component);
            console.warn(formatted);
            // Report warnings to Sentry in production
            if (!isDevelopment && Sentry) {
                Sentry.captureMessage(message, {
                    level: 'warning',
                    tags: {
                        source: sourceOverride || source,
                        component: component || 'unknown',
                    },
                    extra: context ? redactSensitiveData(context) : undefined,
                });
            }
        },
        error(message, context, sourceOverride, component) {
            if (!shouldLog('error', currentLevel))
                return;
            const formatted = formatMessage(message, context, sourceOverride || source, component);
            console.error(formatted);
            // Always report errors to Sentry
            if (Sentry) {
                const error = context?.error instanceof Error
                    ? context.error
                    : new Error(message);
                Sentry.captureException(error, {
                    tags: {
                        source: sourceOverride || source,
                        component: component || 'unknown',
                    },
                    extra: context ? redactSensitiveData(context) : undefined,
                });
            }
        },
    };
}
/**
 * Default logger instance
 */
export const logger = createLogger('app');
/**
 * Create logger for specific component
 */
export function createComponentLogger(component, source = 'app') {
    const baseLogger = createLogger(source);
    return {
        debug(message, context, sourceOverride) {
            baseLogger.debug(message, context, sourceOverride, component);
        },
        info(message, context, sourceOverride) {
            baseLogger.info(message, context, sourceOverride, component);
        },
        warn(message, context, sourceOverride) {
            baseLogger.warn(message, context, sourceOverride, component);
        },
        error(message, context, sourceOverride) {
            baseLogger.error(message, context, sourceOverride, component);
        },
    };
}
