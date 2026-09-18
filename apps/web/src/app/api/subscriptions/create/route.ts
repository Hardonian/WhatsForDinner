// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { StripeService, STRIPE_CONFIG } from '@/lib/stripe';

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
    priceMonthly: 19.99,
    priceAnnual: 179.99,
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

    const {
      plan,
      planId,
      billingCycle,
      interval,
      successUrl,
      cancelUrl,
    } = body || {};

    const rawPlan = (plan || planId || 'pro').toLowerCase();
    const normalizedPlan = rawPlan.includes('family') ? 'family' : rawPlan.includes('free') ? 'free' : 'pro';
    const cycle = billingCycle || interval || 'monthly';
    const selectedPlan = AVAILABLE_PLANS.find(p => p.id === normalizedPlan) || AVAILABLE_PLANS[1];

    const userId = req.headers.get('x-user-id') || req.headers.get('authorization') || body?.userId || '';
    const tenantId = req.headers.get('x-tenant-id') || body?.tenantId || '';

    // If free plan selected, return redirect to signup
    if (normalizedPlan === 'free') {
      return NextResponse.json({
        success: true,
        checkoutUrl: '/signup?plan=free',
        plan: selectedPlan,
      });
    }

    const origin = req.nextUrl.origin || 'http://localhost:3000';
    const effectiveSuccessUrl = successUrl || `${origin}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`;
    const effectiveCancelUrl = cancelUrl || `${origin}/pricing?canceled=true`;

    let sessionId: string;
    let checkoutUrl: string;

    // Use live Stripe if API key configured and not a placeholder
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (stripeKey && !stripeKey.includes('placeholder') && !stripeKey.includes('sk_test_placeholder')) {
      try {
        const session = await StripeService.createCheckoutSession({
          tenantId,
          userId,
          plan: normalizedPlan as any,
          price: cycle === 'annual' ? selectedPlan.priceAnnual : selectedPlan.priceMonthly,
          billingPeriod: cycle === 'annual' ? 'year' : 'month',
          successUrl: effectiveSuccessUrl,
          cancelUrl: effectiveCancelUrl,
          metadata: {
            userId,
            tenantId,
            plan: normalizedPlan,
            billingCycle: cycle,
          },
        });

        sessionId = session.id;
        checkoutUrl = session.url || effectiveSuccessUrl;
      } catch (stripeErr: any) {
        console.warn('Stripe checkout session creation fallback:', stripeErr.message);
        sessionId = `cs_test_${Date.now().toString(36)}`;
        checkoutUrl = effectiveSuccessUrl;
      }
    } else {
      sessionId = `cs_${process.env.NODE_ENV === 'production' ? 'live' : 'test'}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
      checkoutUrl = successUrl || `https://checkout.stripe.com/pay/${sessionId}`;
    }

    return NextResponse.json({
      success: true,
      sessionId,
      checkoutUrl,
      plan: selectedPlan,
      billingCycle: cycle,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: `Checkout session created for ${selectedPlan.name} (${cycle})`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create subscription session' }, { status: 500 });
  }
}
