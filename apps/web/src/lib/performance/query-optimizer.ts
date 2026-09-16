/**
 * Query Optimization Utilities
 * 
 * Provides utilities for optimizing database queries and preventing N+1 problems
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('query-optimizer');

/**
 * Batch database queries to prevent N+1 problems
 * 
 * @param items - Array of items to query
 * @param queryFn - Function that takes an array of items and returns a promise
 * @param batchSize - Number of items per batch (default: 100)
 * @returns Promise resolving to array of results
 * 
 * @example
 * ```ts
 * const userIds = [1, 2, 3, 4, 5];
 * const users = await batchQuery(userIds, async (ids) => {
 *   return supabase.from('users').select('*').in('id', ids);
 * });
 * ```
 */
export async function batchQuery<T, R>(
  items: T[],
  queryFn: (batch: T[]) => Promise<R[]>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    try {
      const batchResults = await queryFn(batch);
      results.push(...batchResults);
    } catch (error) {
      _logger.error('Batch query failed', {
        batchIndex: i,
        batchSize: batch.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
  
  return results;
}

/**
 * Optimize array.map() with async operations using Promise.all
 * 
 * @param items - Array of items
 * @param mapper - Async mapper function
 * @returns Promise resolving to mapped array
 * 
 * @example
 * ```ts
 * // ❌ Bad: Sequential execution
 * const results = await items.map(async item => await processItem(item));
 * 
 * // ✅ Good: Parallel execution
 * const results = await parallelMap(items, item => processItem(item));
 * ```
 */
export async function parallelMap<T, R>(
  items: T[],
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  return Promise.all(items.map((item, index) => mapper(item, index)));
}

/**
 * Cache query results with TTL
 * 
 * @param key - Cache key
 * @param queryFn - Function that returns the query result
 * @param ttl - Time to live in milliseconds
 * @param cache - Cache instance (default: in-memory cache)
 * @returns Cached or fresh result
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttl: number = 60000, // 1 minute default
  cache: Map<string, { data: T; expires: number }> = new Map()
): Promise<T> {
  const cached = cache.get(key);
  
  if (cached && cached.expires > Date.now()) {
    _logger.debug('Cache hit', { key });
    return cached.data;
  }
  
  _logger.debug('Cache miss', { key });
  const data = await queryFn();
  
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  });
  
  return data;
}

/**
 * Optimize Supabase query by selecting only needed fields
 * 
 * @param query - Supabase query builder
 * @param fields - Array of field names to select
 * @returns Optimized query
 */
export function selectFields<T>(
  query: { select: (fields: string) => T },
  fields: string[]
): T {
  return query.select(fields.join(', '));
}

/**
 * Add pagination to queries
 * 
 * @param query - Supabase query builder
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Paginated query
 */
export function paginate<T extends { range: (from: number, to: number) => T }>(
  query: T,
  page: number = 1,
  pageSize: number = 20
): T {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return query.range(from, to);
}

/**
 * Monitor query performance
 * 
 * @param queryName - Name of the query for logging
 * @param queryFn - Query function to execute
 * @returns Query result with performance metrics
 */
export async function monitorQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      _logger.warn('Slow query detected', {
        queryName,
        duration,
      });
    } else {
      _logger.debug('Query completed', {
        queryName,
        duration,
      });
    }
    
    return { result, duration };
  } catch (error) {
    const duration = Date.now() - start;
    _logger.error('Query failed', {
      queryName,
      duration,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
