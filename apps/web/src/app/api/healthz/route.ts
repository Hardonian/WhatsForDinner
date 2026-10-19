import { NextResponse } from 'next/server';
import { runHealthCheck } from '@whats-for-dinner/utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const checkFn = (globalThis as any).__mockRunHealthCheck || runHealthCheck;
    const health = await checkFn();
    const status = health.status === 'healthy' ? 200 : 503;
    return NextResponse.json(health, {
      status,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: (error as Error).message },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'GET' } });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'GET' } });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405, headers: { Allow: 'GET' } });
}
