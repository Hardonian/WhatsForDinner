/**
 * Input Validation and Sanitization Middleware
 * 
 * Provides comprehensive input validation and sanitization to prevent
 * injection attacks, XSS, and other security vulnerabilities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Maximum request body size (10MB default)
const MAX_BODY_SIZE = parseInt(process.env.MAX_BODY_SIZE || '10485760', 10);

// Maximum URL length
const MAX_URL_LENGTH = parseInt(process.env.MAX_URL_LENGTH || '2048', 10);

// Maximum query string length
const MAX_QUERY_LENGTH = parseInt(process.env.MAX_QUERY_LENGTH || '2048', 10);

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 10000); // Limit length
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, any> = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) =>
          typeof item === 'string' ? sanitizeString(item) : item
        );
      } else {
        sanitized[key] = sanitizeObject(sanitized[key] as Record<string, unknown>);
      }
    }
  }
  
  return sanitized as T;
}

/**
 * Validate request size
 */
export function validateRequestSize(req: NextRequest): { valid: boolean; error?: string } {
  const url = req.url;
  
  // Check URL length
  if (url.length > MAX_URL_LENGTH) {
    return {
      valid: false,
      error: `URL exceeds maximum length of ${MAX_URL_LENGTH} characters`,
    };
  }
  
  // Check query string length
  const queryString = url.split('?')[1] || '';
  if (queryString.length > MAX_QUERY_LENGTH) {
    return {
      valid: false,
      error: `Query string exceeds maximum length of ${MAX_QUERY_LENGTH} characters`,
    };
  }
  
  // Check Content-Length header
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (size > MAX_BODY_SIZE) {
      return {
        valid: false,
        error: `Request body exceeds maximum size of ${MAX_BODY_SIZE} bytes`,
      };
    }
  }
  
  return { valid: true };
}

/**
 * Validate and sanitize request body
 */
export async function validateRequestBody<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: string; status: number }> {
  try {
    // Check request size first
    const sizeCheck = validateRequestSize(req);
    if (!sizeCheck.valid) {
      return {
        success: false,
        error: sizeCheck.error || 'Request size validation failed',
        status: 413,
      };
    }
    
    // Parse body
    let body;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      try {
        body = await req.json();
      } catch (error) {
        return {
          success: false,
          error: 'Invalid JSON in request body',
          status: 400,
        };
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        const formData = await req.formData();
        body = Object.fromEntries(formData.entries());
      } catch (error) {
        return {
          success: false,
          error: 'Invalid form data',
          status: 400,
        };
      }
    } else {
      return {
        success: false,
        error: 'Unsupported content type',
        status: 415,
      };
    }
    
    // Validate with schema
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        success: false,
        error: `Validation failed: ${result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        status: 400,
      };
    }
    
    // Sanitize the validated data
    const sanitized = sanitizeObject(result.data as Record<string, unknown>);
    
    return {
      success: true,
      data: sanitized as z.infer<T>,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during validation',
      status: 500,
    };
  }
}

/**
 * Validate query parameters
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  req: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: string; status: number } {
  try {
    const url = new URL(req.url);
    const params: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    const result = schema.safeParse(params);
    
    if (!result.success) {
      return {
        success: false,
        error: `Query validation failed: ${result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
        status: 400,
      };
    }
    
    // Sanitize
    const sanitized = sanitizeObject(result.data as Record<string, unknown>);
    
    return {
      success: true,
      data: sanitized as z.infer<T>,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during query validation',
      status: 500,
    };
  }
}

/**
 * Middleware to validate request size
 */
export function withRequestSizeValidation(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const validation = validateRequestSize(req);
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Request validation failed',
          message: validation.error,
        },
        { status: 413 }
      );
    }
    
    return handler(req);
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  id: z.string().uuid().or(z.string().regex(/^[a-zA-Z0-9-_]+$/)),
  email: z.string().email().max(255),
  url: z.string().url().max(2048),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};
