import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('streak-freeze-api');

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

  const userId = req.headers.get('x-user-id') || req.headers.get('authorization');
  let isFreezeActive = false;

  if (userId) {
    try {
      const { data } = await supabaseAdmin
        .from('user_gamification')
        .select('streak_freeze_active, streak_freeze_purchased_at')
        .eq('user_id', userId)
        .maybeSingle();

      isFreezeActive = Boolean(data?.streak_freeze_active);
    } catch (err) {
      logger.warn('Could not read user streak freeze status', { userId, error: err });
    }
  }

  return NextResponse.json({
    status: 'ok',
    price: 1.99,
    currency: 'USD',
    isFreezeActive,
    benefits: [
      'Preserves current cooking streak',
      'Protects community leaderboard standing',
      'Valid for 48 hours of missed cooking check-ins',
    ],
  });
}

export async function POST(req: NextRequest) {
  const authError = checkAuth(req);
  if (authError) return authError;

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || req.headers.get('x-user-id') || req.headers.get('authorization') || '';
    const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const successUrl = body.successUrl || `${origin}/dashboard?streak_frozen=true`;
    const cancelUrl = body.cancelUrl || `${origin}/dashboard`;

    logger.info('Initiating streak freeze purchase session', { userId });

    const session = await StripeService.createCheckoutSession({
      userId,
      price: 1.99,
      currency: 'usd',
      metadata: {
        type: 'streak_freeze',
        productName: "What's For Dinner - Streak Freeze Protection",
        userId,
      },
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({
      status: 'ok',
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
      price: 1.99,
    });
  } catch (err: any) {
    logger.error('Failed to initiate streak freeze session', { error: err });
    return NextResponse.json(
      { error: err?.message || 'Failed to create streak freeze checkout' },
      { status: 500 }
    );
  }
}
