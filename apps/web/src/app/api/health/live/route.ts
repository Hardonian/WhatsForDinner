import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Liveness only proves that this application process can serve a request.
 * Dependency availability is intentionally handled by /api/health/ready.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
    { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
