// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { freemiumConverter } from '@/lib/monetization/freemium-converter';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl?.searchParams;
    const page = searchParams?.get('page') || 'dashboard';
    const decision = await freemiumConverter.shouldShowPaywall('user-123', 'tenant-456', page);
    return NextResponse.json(decision);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST() { return NextResponse.json({ status: 'ok', stub: true }); }
