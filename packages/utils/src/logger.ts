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

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  debug(message: string, context?: LogContext, source?: string, component?: string): void;
  info(message: string, context?: LogContext, source?: string, component?: string): void;
  warn(message: string, context?: LogContext, source?: string, component?: string): void;
  error(message: string, context?: LogContext, source?: string, component?: string): void;
}

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
function redactSensitiveData(context: LogContext): LogContext {
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
      redacted[key] = redactSensitiveData(value as LogContext);
    }
  }
  
  return redacted;
}

/**
 * Get current log level from environment
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  const validLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  
  if (envLevel && validLevels.includes(envLevel as LogLevel)) {
    return envLevel as LogLevel;
  }
  
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel, currentLevel: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  return levels.indexOf(level) >= levels.indexOf(currentLevel);
}

/**
 * Format log message with context
 */
function formatMessage(
  message: string,
  context?: LogContext,
  source?: string,
  component?: string
): string {
  const parts: string[] = [];
  
  if (source) parts.push(`[${source}]`);
  if (component) parts.push(`[${component}]`);
  
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
export function createLogger(source = 'app'): Logger {
  const currentLevel = getLogLevel();
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Try to import Sentry if available
  let Sentry: any = null;
  try {
    // Dynamic import to avoid breaking if Sentry is not installed
    Sentry = require('@sentry/nextjs');
  } catch {
    // Sentry not available, continue without it
  }
  
  return {
    debug(message: string, context?: LogContext, sourceOverride?: string, component?: string): void {
      if (!shouldLog('debug', currentLevel)) return;
      
      const formatted = formatMessage(message, context, sourceOverride || source, component);
      
      if (isDevelopment) {
        console.debug(formatted);
      }
    },
    
    info(message: string, context?: LogContext, sourceOverride?: string, component?: string): void {
      if (!shouldLog('info', currentLevel)) return;
      
      const formatted = formatMessage(message, context, sourceOverride || source, component);
      
      if (isDevelopment) {
        console.info(formatted);
      } else {
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
    
    warn(message: string, context?: LogContext, sourceOverride?: string, component?: string): void {
      if (!shouldLog('warn', currentLevel)) return;
      
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
    
    error(message: string, context?: LogContext, sourceOverride?: string, component?: string): void {
      if (!shouldLog('error', currentLevel)) return;
      
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
export function createComponentLogger(component: string, source = 'app'): Logger {
  const baseLogger = createLogger(source);
  
  return {
    debug(message: string, context?: LogContext, sourceOverride?: string): void {
      baseLogger.debug(message, context, sourceOverride, component);
    },
    info(message: string, context?: LogContext, sourceOverride?: string): void {
      baseLogger.info(message, context, sourceOverride, component);
    },
    warn(message: string, context?: LogContext, sourceOverride?: string): void {
      baseLogger.warn(message, context, sourceOverride, component);
    },
    error(message: string, context?: LogContext, sourceOverride?: string): void {
      baseLogger.error(message, context, sourceOverride, component);
    },
  };
}
