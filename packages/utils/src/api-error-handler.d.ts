/**
 * Standardized API Error Handler
 *
 * Provides consistent error handling for all API routes with:
 * - Proper error logging
 * - User-friendly error messages
 * - Sentry integration
 * - Correlation ID tracking
 */
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
export declare function handleApiError(error: unknown, options?: ApiErrorHandlerOptions): Response;
/**
 * Wrapper for API route handlers with standardized error handling
 */
export declare function withApiErrorHandler<T extends (...args: unknown[]) => Promise<Response>>(handler: T, options?: ApiErrorHandlerOptions): T;
/**
 * Extract correlation ID from request
 */
export declare function getCorrelationId(request: Request | {
    headers?: Headers;
}): string;
//# sourceMappingURL=api-error-handler.d.ts.map