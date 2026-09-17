import { NextResponse } from 'next/server';
import { runHealthCheck } from '@whats-for-dinner/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const checkFn = (globalThis as any).__mockRunHealthCheck || runHealthCheck;
    const health = await checkFn();
    const status = health.status === 'unhealthy' ? 503 : 200;
    return NextResponse.json(health, { status });
  } catch (error) {
    return NextResponse.json({ status: 'unhealthy', error: (error as Error).message }, { status: 503 });
  }
}
