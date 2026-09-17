/**
 * Error Taxonomy & Utilities
 *
 * Centralized error handling with consistent error codes,
 * types, and user-friendly messages.
 *
 * Re-exports from apps/web for consistency across packages.
 */
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    TOKEN_INVALID = "TOKEN_INVALID",
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    ROUTE_NOT_FOUND = "ROUTE_NOT_FOUND",
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
    TOO_MANY_REQUESTS = "TOO_MANY_REQUESTS",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    TIMEOUT_ERROR = "TIMEOUT_ERROR"
}
export interface ErrorDetails {
    field?: string;
    value?: unknown;
    reason?: string;
    [key: string]: unknown;
}
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly details?: ErrorDetails | undefined;
    readonly isOperational: boolean;
    constructor(code: ErrorCode, message: string, statusCode?: number, details?: ErrorDetails | undefined, isOperational?: boolean);
    toJSON(): Record<string, unknown>;
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: ErrorDetails);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, details?: ErrorDetails);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string, details?: ErrorDetails);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, details?: ErrorDetails);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string, details?: ErrorDetails);
}
export declare class InternalError extends AppError {
    constructor(message?: string, details?: ErrorDetails);
}
export declare class ExternalServiceError extends AppError {
    constructor(message?: string, details?: ErrorDetails, statusCode?: number);
}
export declare function isAppError(error: unknown): error is AppError;
export declare function handleError(error: unknown): AppError;
export declare function getErrorMessage(error: unknown): string;
export declare function getErrorStatusCode(error: unknown): number;
export declare const USER_FRIENDLY_MESSAGES: Record<ErrorCode, string>;
export declare function getUserFriendlyMessage(error: unknown): string;
//# sourceMappingURL=errors.d.ts.map