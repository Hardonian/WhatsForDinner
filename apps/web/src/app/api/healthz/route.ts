import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Backwards-compatible liveness endpoint used by deployment tooling. */
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
