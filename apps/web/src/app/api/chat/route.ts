import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json({ status: 'ok', stub: true }); }
export async function POST(req?: NextRequest) {
  const authHeader = req?.headers?.get('authorization');
  const contentType = req?.headers?.get('content-type');
  if (!contentType && !authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ status: 'ok', stub: true });
}
export async function PUT() { return NextResponse.json({ status: 'ok', stub: true }); }
export async function DELETE() { return NextResponse.json({ status: 'ok', stub: true }); }
