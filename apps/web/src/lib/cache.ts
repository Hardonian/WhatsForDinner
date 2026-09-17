/**
 * Caching Strategy
 * 
 * Provides caching utilities with Redis-ready interface
 * Falls back to in-memory cache for development
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByTag(tag: string): Promise<void>;
  clear(): Promise<void>;
}

// In-memory cache (fallback for development)
class MemoryCacheStore implements CacheStore {
  private store: Map<string, { value: unknown; expiresAt: number; tags?: string[] }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return entry.value as T;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const expiresAt = options?.ttl
      ? Date.now() + options.ttl * 1000
      : Date.now() + 60 * 60 * 1000; // Default 1 hour
    
    this.store.set(key, {
      value,
      expiresAt,
      tags: options?.tags,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async deleteByTag(tag: string): Promise<void> {
    for (const [key, entry] of this.store.entries()) {
      if (entry.tags?.includes(tag)) {
        this.store.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

// Redis cache store (for production)
class RedisCacheStore implements CacheStore {
  private redis: any; // Redis client (to be initialized)
  private prefix: string;

  constructor(redisClient: any, prefix = 'app:') {
    this.redis = redisClient;
    this.prefix = prefix;
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(this.getKey(key));
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const ttl = options?.ttl || 3600; // Default 1 hour
      
      await this.redis.setex(this.getKey(key), ttl, serialized);
      
      // Store tags for invalidation
      if (options?.tags && options.tags.length > 0) {
        for (const tag of options.tags) {
          await this.redis.sadd(`${this.prefix}tag:${tag}`, this.getKey(key));
          await this.redis.expire(`${this.prefix}tag:${tag}`, ttl);
        }
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async deleteByTag(tag: string): Promise<void> {
    try {
      const keys = await this.redis.smembers(`${this.prefix}tag:${tag}`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      await this.redis.del(`${this.prefix}tag:${tag}`);
    } catch (error) {
      console.error('Redis deleteByTag error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(`${this.prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }
}

// Initialize cache store
let cacheStore: CacheStore;

function initCache(): CacheStore {
  if (cacheStore) return cacheStore;
  
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl && typeof window === 'undefined') {
    // Server-side: Try to use Redis
    try {
      // Dynamic import to avoid requiring redis in client bundle
      const { createClient } = require('redis');
      const client = createClient({ url: redisUrl });
      
      // Connect to Redis (async, but we'll handle it)
      client.connect().catch((err: Error) => {
        console.warn('Redis connection failed, using memory cache:', err.message);
      });
      
      cacheStore = new RedisCacheStore(client);
      console.log('Using Redis cache store');
      return cacheStore;
    } catch (error) {
      console.warn('Redis not available, falling back to memory cache:', error);
    }
  }
  
  // Fallback to in-memory cache
  cacheStore = new MemoryCacheStore();
  console.log('Using in-memory cache store');
  return cacheStore;
}

// Export cache interface
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const store = initCache();
    return store.get<T>(key);
  },

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const store = initCache();
    return store.set(key, value, options);
  },

  async delete(key: string): Promise<void> {
    const store = initCache();
    return store.delete(key);
  },

  async deleteByTag(tag: string): Promise<void> {
    const store = initCache();
    return store.deleteByTag(tag);
  },

  async clear(): Promise<void> {
    const store = initCache();
    return store.clear();
  },
};

// Cache key generators
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  recipe: (recipeId: string) => `recipe:${recipeId}`,
  mealPlan: (userId: string, day: string) => `mealplan:${userId}:${day}`,
  groceryList: (householdId: string, listId: string) => `grocery:${householdId}:${listId}`,
};

// Cache tags
export const cacheTags = {
  user: (userId: string) => `user:${userId}`,
  recipes: 'recipes',
  mealPlans: (userId: string) => `mealplans:${userId}`,
  groceryLists: (householdId: string) => `grocery:${householdId}`,
};

/**
 * Cache wrapper for async functions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  options?: CacheOptions
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Try cache first
    const cached = await cache.get<ReturnType<T>>(key);
    if (cached !== null) {
      return cached;
    }
    
    // Execute function
    const result = await fn(...args);
    
    // Cache result
    await cache.set(key, result, options);
    
    return result;
  }) as T;
}

export const suggestionCache = {
  get: (key: any): any => null,
  set: (key: any, val: any): void => {},
};
