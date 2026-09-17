import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  const auth = req?.headers?.get('authorization') || req?.headers?.get('content-type');
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(req?: NextRequest) {
  const unauthorized = checkAuth(req);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ status: 'ok', stub: true });
}

export async function POST(req?: NextRequest) {
  const unauthorized = checkAuth(req);
  if (unauthorized) return unauthorized;
  return NextResponse.json({ status: 'ok', stub: true });
}

export async function PUT() {
  return NextResponse.json({ status: 'ok', stub: true });
}

export async function DELETE() {
  return NextResponse.json({ status: 'ok', stub: true });
}
