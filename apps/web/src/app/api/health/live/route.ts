import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Liveness must be cheap, dependency-free, and publicly callable. It answers
 * whether this Next.js process can receive traffic; dependency checks belong
 * to the readiness and comprehensive health endpoints.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'web',
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
