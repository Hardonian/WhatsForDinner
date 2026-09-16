// @ts-nocheck
/**
 * Standardized API Error Handler
 * 
 * Provides consistent error handling for all API routes with:
 * - Proper error logging
 * - User-friendly error messages
 * - Sentry integration
 * - Correlation ID tracking
 */

import { NextResponse } from 'next/server';
import { createComponentLogger } from './logger';
import { AppError, ErrorCode, getUserFriendlyMessage, isAppError } from './errors';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    correlationId?: string;
  };
}

export interface ApiErrorHandlerOptions {
  /**
   * Component name for logging
   */
  component?: string;
  
  /**
   * Whether to include correlation ID in response
   */
  includeCorrelationId?: boolean;
  
  /**
   * Custom error context
   */
  context?: Record<string, unknown>;
}

/**
 * Standardized error handler for API routes
 */
export function handleApiError(
  error: unknown,
  options: ApiErrorHandlerOptions = {}
): NextResponse<ErrorResponse> {
  const {
    component = 'api',
    includeCorrelationId = true,
    context = {},
  } = options;
  
  const logger = createComponentLogger(component);
  const correlationId = includeCorrelationId 
    ? (context.correlationId as string) || crypto.randomUUID()
    : undefined;
  
  // Convert to AppError if not already
  const appError = isAppError(error) 
    ? error 
    : new AppError(
        ErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'An unexpected error occurred',
        500,
        { originalError: String(error) }
      );
  
  // Log error
  logger.error('API error occurred', {
    ...context,
    errorCode: appError.code,
    statusCode: appError.statusCode,
    error: appError.message,
    stack: error instanceof Error ? error.stack : undefined,
    correlationId,
  });
  
  // Get user-friendly message
  const userMessage = getUserFriendlyMessage(appError);
  
  // Build error response
  const errorResponse: ErrorResponse = {
    error: {
      code: appError.code,
      message: userMessage,
      ...(correlationId && { correlationId }),
    },
  };
  
  // Include details in development or for client errors
  if (process.env.NODE_ENV === 'development' || appError.statusCode < 500) {
    if (appError.details) {
      errorResponse.error.details = appError.details as Record<string, unknown>;
    }
  }
  
  return NextResponse.json(errorResponse, {
    status: appError.statusCode,
    headers: {
      ...(correlationId && { 'X-Correlation-ID': correlationId }),
    },
  });
}

/**
 * Wrapper for API route handlers with standardized error handling
 */
export function withApiErrorHandler<T extends (...args: unknown[]) => Promise<Response>>(
  handler: T,
  options: ApiErrorHandlerOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, {
        ...options,
        context: {
          ...options.context,
          // Try to extract correlation ID from request headers
          correlationId: args[0]?.headers?.get?.('x-correlation-id') || 
                        args[0]?.headers?.get?.('X-Correlation-ID'),
        },
      });
    }
  }) as T;
}

/**
 * Extract correlation ID from request
 */
export function getCorrelationId(request: Request | { headers?: Headers }): string {
  const headers = 'headers' in request ? request.headers : 
                  'get' in request ? request as unknown as Headers : null;
  
  if (!headers) return crypto.randomUUID();
  
  return headers.get('x-correlation-id') || 
         headers.get('X-Correlation-ID') || 
         crypto.randomUUID();
}
