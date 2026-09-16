import type { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Service initializing' }, { status: 503 });
}
export async function GET(req: NextRequest) {
  return NextResponse.json({ error: 'Service initializing' }, { status: 503 });
}

export const dynamic = "force-dynamic";
