// @ts-nocheck
/**
 * Enhanced Error Handler
 * 
 * Provides structured error handling with logging, user-friendly messages,
 * and proper error classification for monitoring and debugging.
 */

import { AppError, ErrorCode, getUserFriendlyMessage, isAppError } from './errors';

/**
 * Simple logger interface for error handling
 */
export interface Logger {
  error(message: string, context?: Record<string, unknown>, source?: string, component?: string): void;
  warn(message: string, context?: Record<string, unknown>, source?: string, component?: string): void;
  info(message: string, context?: Record<string, unknown>, source?: string, component?: string): void;
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  [key: string]: unknown;
}

export interface ErrorHandlerOptions {
  /**
   * Logger instance for error logging
   */
  logger?: Logger;
  
  /**
   * Whether to log errors (default: true)
   */
  logErrors?: boolean;
  
  /**
   * Whether to include stack traces in logs (default: true in development)
   */
  includeStackTrace?: boolean;
  
  /**
   * Whether to sanitize error messages for user display (default: true)
   */
  sanitizeForUser?: boolean;
  
  /**
   * Custom error context
   */
  context?: ErrorContext;
}

/**
 * Sanitize error message for user display
 * Removes sensitive information and technical details
 */
function sanitizeErrorMessage(error: unknown, message: string): string {
  // Don't expose internal errors to users
  if (message.includes('ECONNREFUSED') ||
      message.includes('ETIMEDOUT') ||
      message.includes('ENOTFOUND') ||
      message.includes('database') ||
      message.includes('connection')) {
    return 'A service error occurred. Please try again later.';
  }
  
  // Don't expose file paths or stack traces
  if (message.includes('/') || message.includes('\\') || message.includes('at ')) {
    return 'An unexpected error occurred. Please try again.';
  }
  
  return message;
}

/**
 * Handle error with logging and user-friendly response
 */
export function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): {
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
} {
  const {
    logger,
    logErrors = true,
    includeStackTrace = process.env.NODE_ENV === 'development',
    sanitizeForUser = true,
    context = {},
  } = options;
  
  // Convert to AppError if not already
  const appError = isAppError(error) ? error : new AppError(
    ErrorCode.INTERNAL_ERROR,
    error instanceof Error ? error.message : 'An unexpected error occurred',
    500,
    { originalError: String(error) }
  );
  
  // Log error
  if (logErrors && logger) {
    const logContext = {
      ...context,
      errorCode: appError.code,
      statusCode: appError.statusCode,
      isOperational: appError.isOperational,
    };
    
    if (includeStackTrace && error instanceof Error) {
      logContext.stackTrace = error.stack;
    }
    
    if (appError.statusCode >= 500) {
      logger.error(
        `Error: ${appError.message}`,
        logContext,
        'api',
        context.endpoint || 'unknown'
      );
    } else {
      logger.warn(
        `Error: ${appError.message}`,
        logContext,
        'api',
        context.endpoint || 'unknown'
      );
    }
  }
  
  // Get user-friendly message
  let userMessage = getUserFriendlyMessage(appError);
  
  if (sanitizeForUser && appError.statusCode >= 500) {
    userMessage = sanitizeErrorMessage(error, userMessage);
  }
  
  // Build error response
  const errorResponse = {
    code: appError.code,
    message: userMessage,
  };
  
  // Include details in development or for client errors
  if (!sanitizeForUser || appError.statusCode < 500) {
    if (appError.details) {
      errorResponse.details = appError.details as Record<string, unknown>;
    }
  }
  
  return {
    statusCode: appError.statusCode,
    error: errorResponse,
  };
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandler<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T,
  options: ErrorHandlerOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      const { statusCode, error: errorResponse } = handleError(error, options);
      
      return new Response(
        JSON.stringify(errorResponse),
        {
          status: statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      ) as ReturnType<T>;
    }
  }) as T;
}

/**
 * Error boundary for React components
 */
export function createErrorBoundary(logger?: Logger) {
  return {
    onError: (error: Error, errorInfo: { componentStack: string }) => {
      if (logger) {
        logger.error(
          'React Error Boundary caught error',
          {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
          },
          'frontend',
          'error-boundary'
        );
      }
    },
  };
}
