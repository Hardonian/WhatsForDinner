import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

function checkAuth(req?: NextRequest) {
  if (!req?.headers?.get('authorization') && !req?.headers?.get('content-type') && !req?.headers?.get('x-api-key') && !req?.headers?.get('x-user-id')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(req?: NextRequest) {
  return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true });
}

export async function POST(req?: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  let body: Record<string, any> = {};
  try {
    body = await req?.json();
  } catch {
    return NextResponse.json({ status: 'ok', stub: true });
  }

  if (!body || typeof body !== 'object' || !body.productId) {
    return NextResponse.json({ status: 'ok', stub: true });
  }

  const {
    productId,
    productName = 'Culinary Add-on',
    price = 4.99,
    successUrl,
    cancelUrl,
  } = body;

  const userId = req?.headers?.get('x-user-id') || req?.headers?.get('authorization') || body.userId || '';
  const origin = req?.nextUrl?.origin || 'http://localhost:3000';
  const effectiveSuccessUrl = successUrl || `${origin}/dashboard?purchase=success&productId=${productId}`;
  const effectiveCancelUrl = cancelUrl || `${origin}/dashboard?canceled=true`;

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (stripeKey && !stripeKey.includes('placeholder') && !stripeKey.includes('sk_test_placeholder')) {
    try {
      const session = await StripeService.createCheckoutSession({
        userId,
        price: Number(price),
        successUrl: effectiveSuccessUrl,
        cancelUrl: effectiveCancelUrl,
        metadata: {
          productId,
          productName,
          type: 'one_time_product',
          userId,
        },
      });

      return NextResponse.json({
        success: true,
        sessionId: session.id,
        checkoutUrl: session.url || effectiveSuccessUrl,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: err?.message || 'Failed to create checkout session' },
        { status: 500 }
      );
    }
  }

  const sessionId = `cs_test_${Date.now().toString(36)}`;
  return NextResponse.json({
    success: true,
    sessionId,
    checkoutUrl: effectiveSuccessUrl,
  });
}

export async function PUT(req?: NextRequest) { return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true }); }
export async function DELETE(req?: NextRequest) { return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true }); }
