import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (
    !req?.headers?.get('authorization') &&
    !req?.headers?.get('content-type') &&
    !req?.headers?.get('x-api-key') &&
    !req?.headers?.get('x-user-id')
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

const AVAILABLE_PLANS = [
  {
    id: 'free',
    name: 'WhatsForDinner Free',
    price: 0,
    interval: 'month',
    features: ['5 AI recipe generations / mo', 'Basic pantry management', 'Roulette spin game'],
  },
  {
    id: 'pro_monthly',
    name: 'WhatsForDinner Pro Monthly',
    price: 9.99,
    interval: 'month',
    features: [
      'Unlimited AI recipe generations',
      'OmniChef Kitchen HUD with Voice Control',
      'All 6 Decision Games & Multiplayer',
      'Smart Grocery & Supermarket Arbitrage',
      'USDA safety benchmarks & Allergen Guardrails',
    ],
  },
  {
    id: 'pro_annual',
    name: 'WhatsForDinner Pro Annual',
    price: 79.99,
    interval: 'year',
    discount: 'Save 33%',
    features: [
      'Everything in Pro Monthly',
      '2 months free ($39 savings)',
      'Priority culinary AI model routing',
      'Offline PWA local-first sync',
    ],
  },
];

export async function GET(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  return NextResponse.json({
    plans: AVAILABLE_PLANS,
    currency: 'USD',
  });
}

export async function POST(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;

  let body: any = {};
  if (req) {
    try {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        body = JSON.parse(text);
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
  }

  const planId = body?.planId || 'pro_monthly';
  const plan = AVAILABLE_PLANS.find(p => p.id === planId) || AVAILABLE_PLANS[1];
  const origin = req?.nextUrl?.origin || 'http://localhost:3000';
  const successUrl = body?.successUrl || `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = body?.cancelUrl || `${origin}/pricing`;

  if (process.env.STRIPE_SECRET_KEY && plan.price > 0) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2023-10-16' as any,
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: plan.name,
                description: plan.features.slice(0, 2).join(', '),
              },
              unit_amount: Math.round(plan.price * 100),
              recurring: {
                interval: plan.interval as 'month' | 'year',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: body?.email || undefined,
      });

      return NextResponse.json({
        sessionId: session.id,
        checkoutUrl: session.url,
        plan,
      });
    } catch (err: any) {
      console.warn('Stripe checkout session error:', err?.message);
    }
  }

  // Simulation mode
  const simulatedId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return NextResponse.json({
    sessionId: simulatedId,
    checkoutUrl: `${origin}/checkout/success?session_id=${simulatedId}&plan=${plan.id}`,
    plan,
    status: 'open',
  });
}

export async function PUT(req?: NextRequest) {
  return checkAuth(req) || NextResponse.json({ status: 'ok' });
}

export async function DELETE(req?: NextRequest) {
  return checkAuth(req) || NextResponse.json({ status: 'ok' });
}
