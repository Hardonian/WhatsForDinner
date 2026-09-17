// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const AVAILABLE_PLANS = [
  {
    id: 'free',
    name: 'Free Kitchen',
    priceMonthly: 0,
    priceAnnual: 0,
    features: ['5 AI Recipe Generates / Day', 'Basic Pantry Tracker', 'Solo Decision Games'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro Chef',
    priceMonthly: 9.99,
    priceAnnual: 89.99,
    features: [
      'Unlimited AI Recipe Customization',
      'Pantry Expiry Radar & Waste Prevention',
      'One-Click Multi-Retailer Cart Export',
      'Live Multiplayer Decision Rooms',
      'Macro & Calorie Target Optimization',
    ],
    popular: true,
  },
  {
    id: 'family',
    name: 'Family Feast',
    priceMonthly: 14.99,
    priceAnnual: 139.99,
    features: [
      'Everything in Pro Chef',
      'Up to 6 Household Members Synced',
      'Picky Eater Filter & Kid-Friendly Adapters',
      'Weekly Automated Meal Plan Generation',
      'Direct Chef Concierge Support',
    ],
    popular: false,
  },
];

export async function GET() {
  return NextResponse.json({
    success: true,
    plans: AVAILABLE_PLANS,
    currency: 'USD',
    trialDays: 7,
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { planId = 'pro', billingCycle = 'monthly', successUrl, cancelUrl } = body || {};

    const selectedPlan = AVAILABLE_PLANS.find(p => p.id === planId) || AVAILABLE_PLANS[1];

    const sessionId = `cs_${process.env.NODE_ENV === 'production' ? 'live' : 'test'}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const checkoutUrl = successUrl || `https://checkout.stripe.com/pay/${sessionId}`;

    return NextResponse.json({
      success: true,
      sessionId,
      checkoutUrl,
      plan: selectedPlan,
      billingCycle,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: `Checkout session created for ${selectedPlan.name} (${billingCycle})`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create subscription session' }, { status: 500 });
  }
}
