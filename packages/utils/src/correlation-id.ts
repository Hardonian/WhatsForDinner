// @ts-nocheck
/**
 * Correlation ID Utilities
 * 
 * Provides request correlation ID tracking for better debugging and tracing
 */

/**
 * Generate a correlation ID
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Extract correlation ID from headers
 */
export function getCorrelationIdFromHeaders(headers: Headers | Record<string, string>): string {
  if (headers instanceof Headers) {
    return headers.get('x-correlation-id') || 
           headers.get('X-Correlation-ID') || 
           generateCorrelationId();
  }
  
  const lowerHeaders = Object.keys(headers).reduce((acc, key) => {
    acc[key.toLowerCase()] = headers[key];
    return acc;
  }, {} as Record<string, string>);
  
  return lowerHeaders['x-correlation-id'] || generateCorrelationId();
}

/**
 * Add correlation ID to response headers
 */
export function addCorrelationIdToHeaders(
  headers: Headers,
  correlationId: string
): void {
  headers.set('X-Correlation-ID', correlationId);
}
