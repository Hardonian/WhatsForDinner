// @ts-nocheck
/**
 * Enhanced Error Handler
 *
 * Provides structured error handling with logging, user-friendly messages,
 * and proper error classification for monitoring and debugging.
 */
import { AppError, ErrorCode, getUserFriendlyMessage, isAppError } from './errors';
/**
 * Sanitize error message for user display
 * Removes sensitive information and technical details
 */
function sanitizeErrorMessage(error, message) {
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
export function handleError(error, options = {}) {
    const { logger, logErrors = true, includeStackTrace = process.env.NODE_ENV === 'development', sanitizeForUser = true, context = {}, } = options;
    // Convert to AppError if not already
    const appError = isAppError(error) ? error : new AppError(ErrorCode.INTERNAL_ERROR, error instanceof Error ? error.message : 'An unexpected error occurred', 500, { originalError: String(error) });
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
            logger.error(`Error: ${appError.message}`, logContext, 'api', context.endpoint || 'unknown');
        }
        else {
            logger.warn(`Error: ${appError.message}`, logContext, 'api', context.endpoint || 'unknown');
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
            errorResponse.details = appError.details;
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
export function withErrorHandler(handler, options = {}) {
    return (async (...args) => {
        try {
            return await handler(...args);
        }
        catch (error) {
            const { statusCode, error: errorResponse } = handleError(error, options);
            return new Response(JSON.stringify(errorResponse), {
                status: statusCode,
                headers: {
                    'Content-Type': 'application/json',
                },
            });
        }
    });
}
/**
 * Error boundary for React components
 */
export function createErrorBoundary(logger) {
    return {
        onError: (error, errorInfo) => {
            if (logger) {
                logger.error('React Error Boundary caught error', {
                    error: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                }, 'frontend', 'error-boundary');
            }
        },
    };
}
