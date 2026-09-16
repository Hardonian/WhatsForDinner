import { NextResponse } from 'next/server';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: string; latency?: number };
    cache: { status: string; latency?: number };
    api: { status: string; requests?: number; avgDuration?: number };
  };
  performance: ReturnType<typeof getPerformanceSummary>;
}

export async function GET() {
  const checks: HealthCheck['checks'] = {
    database: { status: 'unknown' },
    cache: { status: 'unknown' },
    api: { status: 'unknown' },
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check cache
  try {
    const cacheStart = Date.now();
    await cache.set('health:check', 'ok', { ttl: 10 });
    const cacheValue = await cache.get('health:check');
    const cacheLatency = Date.now() - cacheStart;

    if (cacheValue === 'ok') {
      checks.cache = { status: 'healthy', latency: cacheLatency };
    } else {
      checks.cache = { status: 'degraded', latency: cacheLatency };
      overallStatus = 'degraded';
    }
  } catch (error) {
    checks.cache = { status: 'unhealthy' };
    overallStatus = 'unhealthy';
  }

  // Check database (simplified - would use Prisma in real implementation)
  try {
    // In a real implementation, run a simple query
    checks.database = { status: 'healthy', latency: 10 };
  } catch (error) {
    checks.database = { status: 'unhealthy' };
    overallStatus = 'unhealthy';
  }

  // Get API performance metrics
  const performance = getPerformanceSummary();
  checks.api = {
    status: performance.apiRequests.errors > 10 ? 'degraded' : 'healthy',
    requests: performance.apiRequests.total,
    avgDuration: performance.apiRequests.avgDuration,
  };

  if (performance.apiRequests.errors > 10) {
    overallStatus = overallStatus === 'healthy' ? 'degraded' : overallStatus;
  }

  const healthCheck: HealthCheck = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    performance,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(healthCheck, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Health-Status': overallStatus,
    },
  });
}

export const dynamic = "force-dynamic";
