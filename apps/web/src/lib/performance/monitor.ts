/**
 * Performance Monitoring
 * Track API latency, database query times, cache hit rates
 * Measurable: Identify bottlenecks, optimize slow queries
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'percent';
  tags?: Record<string, string>;
  timestamp?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;

  /**
   * Track API endpoint performance
   * Measurable: Identify slow endpoints
   */
  trackEndpoint(endpoint: string, duration: number, statusCode: number): void {
    this.record({
      name: 'api.endpoint.duration',
      value: duration,
      unit: 'ms',
      tags: { endpoint, statusCode: statusCode.toString() },
    });
  }

  /**
   * Track database query performance
   * Measurable: Identify slow queries
   */
  trackQuery(query: string, duration: number): void {
    this.record({
      name: 'db.query.duration',
      value: duration,
      unit: 'ms',
      tags: { query: query.substring(0, 50) },
    });
  }

  /**
   * Track cache hit rate
   * Measurable: Optimize caching strategy
   */
  trackCacheHit(hit: boolean, key: string): void {
    this.record({
      name: 'cache.hit',
      value: hit ? 1 : 0,
      unit: 'count',
      tags: { key: key.substring(0, 50) },
    });
  }

  /**
   * Track error rate
   * Measurable: Monitor system health
   */
  trackError(errorType: string, endpoint?: string): void {
    this.record({
      name: 'error.count',
      value: 1,
      unit: 'count',
      tags: { errorType, endpoint: endpoint || 'unknown' },
    });
  }

  /**
   * Record metric
   */
  private record(metric: PerformanceMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now(),
    });

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Send to analytics if configured
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric).catch(() => {
        // Fail silently
      });
    }
  }

  /**
   * Send metrics to analytics service
   */
  private async sendToAnalytics(metric: PerformanceMetric): Promise<void> {
    // Send to Supabase analytics_events table
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = createClient();
      
      await supabase.from('analytics_events').insert({
        event_type: 'performance_metric',
        properties: metric,
        timestamp: new Date(metric.timestamp).toISOString(),
      });
    } catch {
      // Fail silently
    }
  }

  /**
   * Get performance summary
   */
  getSummary(timeWindow: number = 3600000): {
    avgApiLatency: number;
    avgQueryTime: number;
    cacheHitRate: number;
    errorRate: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const recent = this.metrics.filter(m => m.timestamp >= cutoff);

    const apiMetrics = recent.filter(m => m.name === 'api.endpoint.duration');
    const queryMetrics = recent.filter(m => m.name === 'db.query.duration');
    const cacheMetrics = recent.filter(m => m.name === 'cache.hit');
    const errorMetrics = recent.filter(m => m.name === 'error.count');

    return {
      avgApiLatency: apiMetrics.length > 0
        ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
        : 0,
      avgQueryTime: queryMetrics.length > 0
        ? queryMetrics.reduce((sum, m) => sum + m.value, 0) / queryMetrics.length
        : 0,
      cacheHitRate: cacheMetrics.length > 0
        ? cacheMetrics.filter(m => m.value === 1).length / cacheMetrics.length
        : 0,
      errorRate: recent.length > 0
        ? errorMetrics.length / recent.length
        : 0,
    };
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance decorator for async functions
 */
export function trackPerformance(name: string) {
  return function <T extends (...args: unknown[]) => Promise<unknown>>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value!;

    descriptor.value = (async function (...args: Parameters<T>) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        performanceMonitor.trackEndpoint(`${name}.${propertyKey}`, duration, 200);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        performanceMonitor.trackEndpoint(`${name}.${propertyKey}`, duration, 500);
        performanceMonitor.trackError(error instanceof Error ? error.name : 'Unknown', `${name}.${propertyKey}`);
        throw error;
      }
    }) as T;

    return descriptor;
  };
}
