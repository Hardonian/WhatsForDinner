/**
 * Rate Limiting Implementation
 * 
 * Provides rate limiting for API routes to prevent abuse and DDoS attacks
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  requests: number;
  window: number; // in seconds
  identifier?: (req: NextRequest) => string;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function getIdentifier(req: NextRequest): string {
  // Try to get IP from various headers (for proxies/CDNs)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : '') || 'unknown';
  
  // In production, you might want to use user ID if authenticated
  // For now, we'll use IP address
  return ip;
}

export function rateLimit(config: RateLimitConfig) {
  const requests = config.requests || 100;
  const window = (config.window || 60) * 1000; // Convert to milliseconds
  const identifierFn = config.identifier || getIdentifier;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const identifier = identifierFn(req);
    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(identifier);
    
    if (!entry || now > entry.resetTime) {
      // Create new window
      entry = {
        count: 0,
        resetTime: now + window,
      };
      rateLimitStore.set(identifier, entry);
    }
    
    // Increment count
    entry.count++;
    
    // Check if limit exceeded
    if (entry.count > requests) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Maximum ${requests} requests per ${config.window || 60} seconds.`,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
          },
        }
      );
    }
    
    // Return null to indicate request should proceed
    // Add rate limit headers
    return null;
  };
}

// Middleware wrapper for easier use in route handlers
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await rateLimit(config)(req);
    
    if (rateLimitResult) {
      return rateLimitResult;
    }
    
    const response = await handler(req);
    
    // Add rate limit headers to successful responses
    const identifier = config.identifier?.(req) || getIdentifier(req);
    const entry = rateLimitStore.get(identifier);
    
    if (entry) {
      response.headers.set('X-RateLimit-Limit', (config.requests || 100).toString());
      response.headers.set(
        'X-RateLimit-Remaining',
        Math.max(0, (config.requests || 100) - entry.count).toString()
      );
      response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
    }
    
    return response;
  };
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // Strict rate limiting for sensitive endpoints
  strict: rateLimit({
    requests: 10,
    window: 60, // 10 requests per minute
  }),
  
  // Standard API rate limiting
  standard: rateLimit({
    requests: 100,
    window: 60, // 100 requests per minute
  }),
  
  // Lenient rate limiting for public endpoints
  lenient: rateLimit({
    requests: 1000,
    window: 60, // 1000 requests per minute
  }),
  
  // Rate limiting for authentication endpoints
  auth: rateLimit({
    requests: 5,
    window: 300, // 5 requests per 5 minutes
  }),
  
  // Rate limiting for recipe generation (API intensive)
  recipeGeneration: rateLimit({
    requests: 20,
    window: 60, // 20 requests per minute
  }),
};
