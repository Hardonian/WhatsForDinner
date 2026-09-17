import { NextResponse } from 'next/server';
import { valueEngine } from '@/lib/monetization/value-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const opportunities = await valueEngine.identifyUpsellOpportunities('tenant-456');
    return NextResponse.json({ opportunities });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST() { return NextResponse.json({ status: 'ok', stub: true }); }
