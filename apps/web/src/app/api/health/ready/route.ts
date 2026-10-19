import { NextResponse } from 'next/server';
import { runHealthCheck } from '@whats-for-dinner/utils';

export const dynamic = 'force-dynamic';

/**
 * Readiness verifies the dependencies needed to serve application traffic.
 * Degraded is deliberately not ready: deployment and uptime gates must fail
 * closed when a dependency cannot be verified.
 */
export async function GET() {
  try {
    const checkFn = (globalThis as any).__mockRunHealthCheck || runHealthCheck;
    const health = await checkFn({ checkTimeout: 5000 });
    const ready = health.status === 'healthy';

    return NextResponse.json(
      {
        status: ready ? 'ready' : 'not-ready',
        timestamp: health.timestamp,
        checks: health.checks,
      },
      {
        status: ready ? 200 : 503,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not-ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Readiness check failed',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
