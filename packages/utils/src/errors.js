// @ts-nocheck
/**
 * Error Taxonomy & Utilities
 *
 * Centralized error handling with consistent error codes,
 * types, and user-friendly messages.
 *
 * Re-exports from apps/web for consistency across packages.
 */
// Re-export error types from web app for consistency
// In a monorepo, you might want to move this to a shared package
export var ErrorCode;
(function (ErrorCode) {
    // Validation errors (400)
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    ErrorCode["INVALID_INPUT"] = "INVALID_INPUT";
    ErrorCode["MISSING_REQUIRED_FIELD"] = "MISSING_REQUIRED_FIELD";
    // Authentication errors (401)
    ErrorCode["AUTHENTICATION_ERROR"] = "AUTHENTICATION_ERROR";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["TOKEN_INVALID"] = "TOKEN_INVALID";
    // Authorization errors (403)
    ErrorCode["AUTHORIZATION_ERROR"] = "AUTHORIZATION_ERROR";
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    // Not found errors (404)
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCode["ROUTE_NOT_FOUND"] = "ROUTE_NOT_FOUND";
    // Rate limiting (429)
    ErrorCode["RATE_LIMIT_ERROR"] = "RATE_LIMIT_ERROR";
    ErrorCode["TOO_MANY_REQUESTS"] = "TOO_MANY_REQUESTS";
    // Internal errors (500)
    ErrorCode["INTERNAL_ERROR"] = "INTERNAL_ERROR";
    ErrorCode["DATABASE_ERROR"] = "DATABASE_ERROR";
    ErrorCode["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
    // External service errors (502/503)
    ErrorCode["EXTERNAL_SERVICE_ERROR"] = "EXTERNAL_SERVICE_ERROR";
    ErrorCode["SERVICE_UNAVAILABLE"] = "SERVICE_UNAVAILABLE";
    ErrorCode["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
})(ErrorCode || (ErrorCode = {}));
export class AppError extends Error {
    code;
    statusCode;
    details;
    isOperational;
    constructor(code, message, statusCode = 500, details, isOperational = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = isOperational;
        this.name = 'AppError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            details: this.details,
            name: this.name,
        };
    }
}
export class ValidationError extends AppError {
    constructor(message, details) {
        super(ErrorCode.VALIDATION_ERROR, message, 400, details);
        this.name = 'ValidationError';
    }
}
export class AuthenticationError extends AppError {
    constructor(message = 'Authentication required', details) {
        super(ErrorCode.AUTHENTICATION_ERROR, message, 401, details);
        this.name = 'AuthenticationError';
    }
}
export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions', details) {
        super(ErrorCode.AUTHORIZATION_ERROR, message, 403, details);
        this.name = 'AuthorizationError';
    }
}
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found', details) {
        super(ErrorCode.NOT_FOUND, message, 404, details);
        this.name = 'NotFoundError';
    }
}
export class RateLimitError extends AppError {
    constructor(message = 'Too many requests', details) {
        super(ErrorCode.RATE_LIMIT_ERROR, message, 429, details);
        this.name = 'RateLimitError';
    }
}
export class InternalError extends AppError {
    constructor(message = 'Internal server error', details) {
        super(ErrorCode.INTERNAL_ERROR, message, 500, details, false);
        this.name = 'InternalError';
    }
}
export class ExternalServiceError extends AppError {
    constructor(message = 'External service error', details, statusCode = 502) {
        super(ErrorCode.EXTERNAL_SERVICE_ERROR, message, statusCode, details);
        this.name = 'ExternalServiceError';
    }
}
export function isAppError(error) {
    return error instanceof AppError;
}
export function handleError(error) {
    if (isAppError(error)) {
        return error;
    }
    if (error instanceof Error) {
        return new InternalError(error.message, { originalError: error.name });
    }
    return new InternalError('An unknown error occurred', { originalError: String(error) });
}
export function getErrorMessage(error) {
    if (isAppError(error)) {
        return error.message;
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
}
export function getErrorStatusCode(error) {
    if (isAppError(error)) {
        return error.statusCode;
    }
    return 500;
}
export const USER_FRIENDLY_MESSAGES = {
    [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
    [ErrorCode.INVALID_INPUT]: 'The information you provided is invalid.',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
    [ErrorCode.AUTHENTICATION_ERROR]: 'Please sign in to continue.',
    [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
    [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',
    [ErrorCode.TOKEN_INVALID]: 'Your session is invalid. Please sign in again.',
    [ErrorCode.AUTHORIZATION_ERROR]: "You don't have permission to perform this action.",
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: "You don't have permission to access this resource.",
    [ErrorCode.FORBIDDEN]: 'Access denied.',
    [ErrorCode.NOT_FOUND]: "The resource you're looking for doesn't exist.",
    [ErrorCode.RESOURCE_NOT_FOUND]: "The resource you're looking for doesn't exist.",
    [ErrorCode.ROUTE_NOT_FOUND]: "The page you're looking for doesn't exist.",
    [ErrorCode.RATE_LIMIT_ERROR]: 'Too many requests. Please try again later.',
    [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later.',
    [ErrorCode.INTERNAL_ERROR]: 'Something went wrong. Please try again later.',
    [ErrorCode.DATABASE_ERROR]: 'A database error occurred. Please try again later.',
    [ErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again later.',
    [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'A service error occurred. Please try again later.',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again later.',
    [ErrorCode.TIMEOUT_ERROR]: 'The request timed out. Please try again.',
};
export function getUserFriendlyMessage(error) {
    if (isAppError(error)) {
        return USER_FRIENDLY_MESSAGES[error.code] || error.message;
    }
    return USER_FRIENDLY_MESSAGES[ErrorCode.UNKNOWN_ERROR];
}
