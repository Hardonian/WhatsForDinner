import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createComponentLogger } from '@whats-for-dinner/utils';
import { requireAuth } from '@/lib/auth-middleware';

const logger = createComponentLogger('credits-purchase-api');

import { CREDIT_PACKS, CreditPackId } from '@/lib/monetization/pricing-packs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('response' in auth) return auth.response;
  const supabaseAdmin = getSupabaseAdmin();
  const userId = auth.context.user.id;
  let currentBalance = 0;

  if (userId) {
    try {
      const { data: rows } = await supabaseAdmin
        .from('usage_credits')
        .select('credits')
        .eq('user_id', userId);

      currentBalance = rows?.reduce((acc, row) => acc + (row.credits || 0), 0) || 0;
    } catch (err) {
      logger.warn('Could not read user credit balance', { userId, error: err });
    }
  }

  return NextResponse.json({
    status: 'ok',
    currentBalance,
    packs: Object.values(CREDIT_PACKS),
  });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ('response' in auth) return auth.response;
    const body = await req.json().catch(() => ({}));
    const packId = (body.packId || 'popular') as CreditPackId;
    const pack = CREDIT_PACKS[packId] || CREDIT_PACKS.popular;

    const userId = auth.context.user.id;
    const tenantId = auth.context.user.tenantId || '';

    const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${origin}/dashboard?credits_purchased=${pack.credits}`;
    const cancelUrl = `${origin}/pricing`;

    logger.info('Creating credit pack checkout session', { packId, credits: pack.credits, userId });

    const session = await StripeService.createCheckoutSession({
      userId,
      tenantId,
      price: pack.price,
      currency: 'usd',
      metadata: {
        type: 'usage_credits',
        packId: pack.id,
        credits: String(pack.credits),
        productName: `What's For Dinner - ${pack.name}`,
      },
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      status: 'ok',
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      pack,
    });
  } catch (err: any) {
    logger.error('Error creating credit purchase session', { error: err });
    return NextResponse.json(
      { error: err?.message || 'Failed to create credit checkout' },
      { status: 500 }
    );
  }
}

export async function PUT() {
  return new NextResponse('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } });
}

export async function DELETE() {
  return new NextResponse('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } });
}
