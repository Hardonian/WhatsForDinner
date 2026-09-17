import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (!req?.headers?.get('authorization') && !req?.headers?.get('content-type') && !req?.headers?.get('x-api-key') && !req?.headers?.get('x-user-id')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(req?: NextRequest) { return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true }); }
export async function POST(req?: NextRequest) { return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true }); }
export async function PUT(req?: NextRequest) { return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true }); }
export async function DELETE(req?: NextRequest) { return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true }); }
