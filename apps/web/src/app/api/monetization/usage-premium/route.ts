import { NextRequest, NextResponse } from 'next/server';
import { usagePremium } from '@/lib/monetization/usage-premium';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const features = usagePremium.getAvailableFeatures();
    return NextResponse.json({ features });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await usagePremium.purchaseCredits('tenant-456', body.featureId, body.quantity);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
