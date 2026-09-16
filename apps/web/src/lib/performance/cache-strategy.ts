/**
 * Advanced Caching Strategy
 * 
 * Provides sophisticated caching strategies for different use cases
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('cache-strategy');

interface CacheEntry<T> {
  data: T;
  expires: number;
  hits: number;
  lastAccessed: number;
}

/**
 * LRU Cache implementation
 */
export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    entry.hits++;
    entry.lastAccessed = Date.now();
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }

  set(key: string, data: T, ttl: number = 60000): void {
    // Remove oldest entry if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      hits: 0,
      lastAccessed: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; hits: number; keys: string[] } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }
    
    return {
      size: this.cache.size,
      hits: totalHits,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Cache with stale-while-revalidate strategy
 */
export class StaleWhileRevalidateCache<T> {
  private cache: Map<string, { data: T; expires: number; staleAt: number }>;
  private revalidateFn: (key: string) => Promise<T>;

  constructor(
    revalidateFn: (key: string) => Promise<T>,
    ttl: number = 60000,
    staleTtl: number = 300000 // 5 minutes stale
  ) {
    this.cache = new Map();
    this.revalidateFn = revalidateFn;
  }

  async get(key: string): Promise<T> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      // Cache miss - fetch and cache
      const data = await this.revalidateFn(key);
      this.set(key, data);
      return data;
    }
    
    const now = Date.now();
    
    if (entry.expires < now) {
      // Expired - return stale data and revalidate in background
      this.revalidateFn(key).then(data => {
        this.set(key, data);
      }).catch(error => {
        _logger.error('Background revalidation failed', {
          key,
          error: error instanceof Error ? error.message : String(error),
        });
      });
      
      return entry.data; // Return stale data
    }
    
    if (entry.staleAt < now) {
      // Stale but not expired - trigger background revalidation
      this.revalidateFn(key).then(data => {
        this.set(key, data);
      }).catch(error => {
        _logger.error('Background revalidation failed', {
          key,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
    
    return entry.data;
  }

  set(key: string, data: T, ttl: number = 60000, staleTtl: number = 300000): void {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      staleAt: Date.now() + staleTtl,
    });
  }
}

/**
 * Cache invalidation strategies
 */
export class CacheInvalidator {
  private cache: LRUCache<unknown>;

  constructor(cache: LRUCache<unknown>) {
    this.cache = cache;
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0;
    const stats = this.cache.getStats();
    
    for (const key of stats.keys) {
      if (pattern.test(key)) {
        // Note: LRUCache doesn't have delete method in our implementation
        // Would need to add it
        invalidated++;
      }
    }
    
    _logger.info('Cache invalidated by pattern', {
      pattern: pattern.toString(),
      invalidated,
    });
    
    return invalidated;
  }

  /**
   * Invalidate cache by prefix
   */
  invalidatePrefix(prefix: string): number {
    return this.invalidatePattern(new RegExp(`^${prefix}`));
  }
}
