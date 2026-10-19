import { NextResponse } from 'next/server';
import { runHealthCheck } from '@whats-for-dinner/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const checkFn = (globalThis as any).__mockRunHealthCheck || runHealthCheck;
    const health = await checkFn();
    const isReady = health.status === 'healthy';

    return NextResponse.json(
      {
        ready: isReady,
        checks: health.checks || {},
        timestamp: new Date().toISOString(),
      },
      {
        status: isReady ? 200 : 503,
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ready: false, error: err?.message || 'Readiness check failed' },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'GET' } });
}
