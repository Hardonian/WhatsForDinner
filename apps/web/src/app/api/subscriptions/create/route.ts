// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { StripeService, STRIPE_CONFIG } from '@/lib/stripe';
import { requireAuth } from '@/lib/auth-middleware';

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
    const auth = await requireAuth(req);
    if (!auth.success) return auth.response;

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

    const rawPlan = String(plan || planId || '').toLowerCase();
    if (!['free', 'pro', 'family'].includes(rawPlan)) {
      return NextResponse.json({ error: 'Invalid subscription plan' }, { status: 400 });
    }
    const normalizedPlan = rawPlan as 'free' | 'pro' | 'family';
    const cycle = billingCycle || interval || 'monthly';
    if (!['monthly', 'annual', 'month', 'year'].includes(cycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }
    const selectedPlan = AVAILABLE_PLANS.find(p => p.id === normalizedPlan)!;
    const { user } = auth.context;
    const userId = user.id;
    const tenantId = user.tenantId || '';

    // If free plan selected, return redirect to signup
    if (normalizedPlan === 'free') {
      return NextResponse.json({
        success: true,
        checkoutUrl: '/signup?plan=free',
        plan: selectedPlan,
      });
    }

    const origin = req.nextUrl.origin;
    const safeReturnUrl = (value: unknown, fallback: string) => {
      if (typeof value !== 'string') return fallback;
      try {
        const candidate = new URL(value, origin);
        return candidate.origin === origin ? candidate.toString() : fallback;
      } catch {
        return fallback;
      }
    };
    const effectiveSuccessUrl = safeReturnUrl(successUrl, `${origin}/dashboard?subscription=success&session_id={CHECKOUT_SESSION_ID}`);
    const effectiveCancelUrl = safeReturnUrl(cancelUrl, `${origin}/pricing?canceled=true`);

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('placeholder')) {
      return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 });
    }

    const annual = cycle === 'annual' || cycle === 'year';
    const session = await StripeService.createCheckoutSession({
      tenantId,
      userId,
      plan: normalizedPlan,
      price: annual ? selectedPlan.priceAnnual : selectedPlan.priceMonthly,
      billingPeriod: annual ? 'year' : 'month',
      successUrl: effectiveSuccessUrl,
      cancelUrl: effectiveCancelUrl,
      metadata: { plan: normalizedPlan, billingCycle: annual ? 'annual' : 'monthly' },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Stripe did not return a checkout URL' }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      plan: selectedPlan,
      billingCycle: cycle,
      message: `Checkout session created for ${selectedPlan.name}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create subscription session' }, { status: 500 });
  }
}
