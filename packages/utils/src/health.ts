/**
 * Production Health Check Utilities
 * 
 * Provides comprehensive health checking for production monitoring:
 * - Database connectivity
 * - External service availability
 * - System resource checks
 * - Dependency health
 */

import { createComponentLogger } from './logger';

const logger = createComponentLogger('health');

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: Record<string, CheckResult>;
  uptime: number;
  version?: string;
}

export interface CheckResult {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  latency?: number;
  details?: Record<string, unknown>;
}

export interface HealthCheckOptions {
  /**
   * Include detailed information in response
   */
  includeDetails?: boolean;
  
  /**
   * Timeout for individual checks (ms)
   */
  checkTimeout?: number;
  
  /**
   * Custom checks to run
   */
  customChecks?: Record<string, () => Promise<CheckResult>>;
}

const startTime = Date.now();

/**
 * Get system uptime
 */
function getUptime(): number {
  return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();

  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    const isPlaceholder = (value?: string) => !value || /placeholder|example|undefined|null/i.test(value);

    if (isPlaceholder(rawUrl) || isPlaceholder(anonKey)) {
      return {
        status: 'fail',
        message: 'Database health-check configuration is missing',
        latency: Date.now() - start,
      };
    }

    let supabaseUrl: URL;
    try {
      supabaseUrl = new URL(rawUrl!);
    } catch {
      return {
        status: 'fail',
        message: 'Database health-check URL is invalid',
        latency: Date.now() - start,
      };
    }

    if (supabaseUrl.protocol !== 'https:' && !['localhost', '127.0.0.1', '::1'].includes(supabaseUrl.hostname)) {
      return {
        status: 'fail',
        message: 'Database health-check URL must use HTTPS',
        latency: Date.now() - start,
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    let response: Response;
    try {
      const endpoint = new URL('/rest/v1/recipes?select=id&limit=1', supabaseUrl);
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: anonKey!,
          Authorization: `Bearer ${anonKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    const latency = Date.now() - start;

    if (!response.ok) {
      return {
        status: 'fail',
        message: `Database dependency returned HTTP ${response.status}`,
        latency,
      };
    }

    return {
      status: 'pass',
      message: 'Database dependency is reachable',
      latency,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database check failed',
      latency: Date.now() - start,
    };
  }
}

/**
 * Check memory usage
 */
async function checkMemory(): Promise<CheckResult> {
  try {
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return {
        status: 'warn',
        message: 'Memory check not available in this environment',
      };
    }
    
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round(usage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(usage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(usage.rss / 1024 / 1024);
    
    // Warn if heap usage exceeds 80% of total
    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;
    
    return {
      status: heapUsagePercent > 80 ? 'warn' : 'pass',
      message: `Memory usage: ${heapUsedMB}MB / ${heapTotalMB}MB heap, ${rssMB}MB RSS`,
      details: {
        heapUsedMB,
        heapTotalMB,
        rssMB,
        heapUsagePercent: Math.round(heapUsagePercent),
      },
    };
  } catch (error) {
    return {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Memory check failed',
    };
  }
}

/**
 * Run comprehensive health check
 */
export async function runHealthCheck(
  options: HealthCheckOptions = {}
): Promise<HealthCheckResult> {
  const {
    includeDetails = false,
    checkTimeout = 5000,
    customChecks = {},
  } = options;
  
  const checks: Record<string, CheckResult> = {};
  
  // Run standard checks
  const checkPromises = [
    { name: 'database', fn: checkDatabase },
    { name: 'memory', fn: checkMemory },
    ...Object.entries(customChecks).map(([name, fn]) => ({ name, fn })),
  ];
  
  // Run checks with timeout
  const results = await Promise.allSettled(
    checkPromises.map(async ({ name, fn }) => {
      try {
        return {
          name,
          result: await Promise.race([
            fn(),
            new Promise<CheckResult>((_, reject) => {
              setTimeout(() => reject(new Error('Check timeout')), checkTimeout);
            }),
          ]),
        };
      } catch (error) {
        return {
          name,
          result: {
            status: 'fail' as const,
            message: error instanceof Error ? error.message : 'Check failed',
          },
        };
      }
    })
  );
  
  // Process results
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      checks[result.value.name] = result.value.result;
    } else {
      checks[`unknown_${Date.now()}`] = {
        status: 'fail',
        message: 'Check execution failed',
      };
    }
  });
  
  // Determine overall status
  const hasFailures = Object.values(checks).some(c => c.status === 'fail');
  const hasWarnings = Object.values(checks).some(c => c.status === 'warn');
  
  const overallStatus: HealthCheckResult['status'] = hasFailures
    ? 'unhealthy'
    : hasWarnings
    ? 'degraded'
    : 'healthy';
  
  // Log health check
  logger.info('Health check completed', {
    status: overallStatus,
    checks: Object.keys(checks),
  });
  
  const healthResult: HealthCheckResult = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    uptime: getUptime(),
  };
  
  if (includeDetails) {
    healthResult.version = process.env.npm_package_version || 'unknown';
  }
  
  return healthResult;
}

/**
 * Create health check endpoint handler
 */
export function createHealthCheckHandler(options: HealthCheckOptions = {}) {
  return async (): Promise<Response> => {
    try {
      const health = await runHealthCheck(options);
      
      const statusCode = health.status === 'healthy' ? 200 : 503;
      
      return new Response(JSON.stringify(health, null, 2), {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (error) {
      logger.error('Health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      return new Response(
        JSON.stringify({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check execution failed',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };
}

/**
 * Liveness probe - simple check if service is running
 */
export function createLivenessHandler(): () => Response {
  return () => {
    return new Response(
      JSON.stringify({
        status: 'alive',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  };
}

/**
 * Readiness probe - check if service is ready to accept traffic
 */
export async function createReadinessHandler(): Promise<Response> {
  try {
    const health = await runHealthCheck({ checkTimeout: 2000 });
    
    const isReady = health.status === 'healthy';
    
    return new Response(
      JSON.stringify({
        status: isReady ? 'ready' : 'not-ready',
        timestamp: new Date().toISOString(),
        checks: health.checks,
      }),
      {
        status: isReady ? 200 : 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        error: 'Readiness check failed',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
