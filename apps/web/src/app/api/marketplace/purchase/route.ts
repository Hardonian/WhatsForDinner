import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripe';
import { CREDIT_PACKS, MARKETPLACE_PACKS } from '@/lib/monetization/pricing-packs';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('marketplace-purchase-api');

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

export async function GET(req: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const packParam = searchParams.get('pack') || searchParams.get('packId') || 'quick-easy';

  // If redirected directly from credits or marketplace UI link
  if (type === 'credits' || CREDIT_PACKS[packParam as keyof typeof CREDIT_PACKS]) {
    const pack = CREDIT_PACKS[packParam as keyof typeof CREDIT_PACKS] || CREDIT_PACKS.popular;
    const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    try {
      const session = await StripeService.createCheckoutSession({
        price: pack.price,
        currency: 'usd',
        metadata: {
          type: 'usage_credits',
          packId: pack.id,
          credits: String(pack.credits),
          productName: `What's For Dinner - ${pack.name}`,
        },
        successUrl: `${origin}/dashboard?credits_purchased=${pack.credits}`,
        cancelUrl: `${origin}/credits`,
      });
      if (session.url) {
        return NextResponse.redirect(session.url);
      }
    } catch (err) {
      logger.error('Error initiating checkout link', { error: err });
    }
  }

  return NextResponse.json({
    status: 'ok',
    packs: Object.values(MARKETPLACE_PACKS),
  });
}

export async function POST(req: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const packId = body.packId || body.id || 'quick-easy';
    const userId = body.userId || req.headers.get('x-user-id') || req.headers.get('authorization') || '';
    const tenantId = body.tenantId || req.headers.get('x-tenant-id') || '';

    const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = body.successUrl || `${origin}/marketplace?success=true&packId=${packId}`;
    const cancelUrl = body.cancelUrl || `${origin}/marketplace?canceled=true`;

    // Check if it's a credit pack or a recipe pack
    let itemPrice = 4.99;
    let itemName = "What's For Dinner Premium Pack";
    let metadata: Record<string, any> = {
      type: 'marketplace_pack',
      packId,
    };

    if (MARKETPLACE_PACKS[packId]) {
      const p = MARKETPLACE_PACKS[packId];
      itemPrice = p.price;
      itemName = p.name;
    } else if (CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS]) {
      const c = CREDIT_PACKS[packId as keyof typeof CREDIT_PACKS];
      itemPrice = c.price;
      itemName = c.name;
      metadata = {
        type: 'usage_credits',
        packId: c.id,
        credits: String(c.credits),
      };
    }

    logger.info('Creating marketplace checkout session', { packId, itemPrice, itemName });

    const session = await StripeService.createCheckoutSession({
      userId,
      tenantId,
      price: itemPrice,
      currency: 'usd',
      metadata: {
        ...metadata,
        productName: itemName,
      },
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      status: 'ok',
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (err: any) {
    logger.error('Error processing marketplace purchase', { error: err });
    return NextResponse.json(
      { error: err?.message || 'Failed to process marketplace checkout' },
      { status: 500 }
    );
  }
}

export async function PUT(req?: NextRequest) {
  return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true });
}

export async function DELETE(req?: NextRequest) {
  return checkAuth(req) || NextResponse.json({ status: 'ok', stub: true });
}
