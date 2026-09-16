/**
 * Redis-based Rate Limiting Implementation
 * 
 * Provides distributed rate limiting using Redis for production environments.
 * Falls back to in-memory store if Redis is not available.
 */

import { NextRequest } from 'next/server';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('rate-limiting-redis');

export interface RateLimitConfig {
  requests: number;
  window: number; // in milliseconds
  identifier?: (req: NextRequest) => string;
}

// In-memory fallback store
const fallbackStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup fallback store periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of fallbackStore.entries()) {
      if (value.resetTime < now) {
        fallbackStore.delete(key);
      }
    }
  }, 60000);
}

/**
 * Get Redis client (lazy initialization)
 */
async function getRedisClient() {
  try {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      return null;
    }

    // Dynamic import to avoid bundling Redis in client-side code
    const { createClient } = await import('redis');
    const client = createClient({ url: redisUrl });
    
    if (!client.isOpen) {
      await client.connect();
    }
    
    return client;
  } catch (error) {
    _logger.warn('Redis not available, falling back to in-memory rate limiting:', { error });
    return null;
  }
}

/**
 * Rate limit check using Redis with fallback to in-memory store
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const redis = await getRedisClient();
  const key = `rate_limit:${identifier}`;
  const now = Date.now();
  const windowMs = config.window;

  if (redis) {
    try {
      // Use Redis with sliding window algorithm
      const pipeline = redis.multi();
      
      // Remove old entries
      pipeline.zRemRangeByScore(key, 0, now - windowMs);
      
      // Count current requests
      pipeline.zCard(key);
      
      // Add current request
      pipeline.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
      
      // Set expiration
      pipeline.expire(key, Math.ceil(windowMs / 1000));
      
      const results = await pipeline.exec();
      const count = (results?.[1] as number) || 0;
      
      const allowed = count < config.requests;
      const remaining = Math.max(0, config.requests - count - 1);
      const resetTime = now + windowMs;
      
      return { allowed, remaining, resetTime };
    } catch (error) {
      _logger.error('Redis rate limit error:', { error: error instanceof Error ? error.message : String(error) });
      // Fall through to fallback
    }
  }

  // Fallback to in-memory store
  const entry = fallbackStore.get(key) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (entry.resetTime < now) {
    entry.count = 0;
    entry.resetTime = now + windowMs;
  }

  entry.count++;
  fallbackStore.set(key, entry);

  const allowed = entry.count <= config.requests;
  const remaining = Math.max(0, config.requests - entry.count);
  
  return { allowed, remaining, resetTime: entry.resetTime };
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getRateLimitIdentifier(req: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  const ip = cfConnectingIp || realIp || (forwarded ? forwarded.split(',')[0].trim() : '') || 'unknown';
  
  return `ip:${ip}`;
}
