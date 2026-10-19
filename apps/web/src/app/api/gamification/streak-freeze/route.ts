import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createComponentLogger } from '@whats-for-dinner/utils';
import { requireAuth } from '@/lib/auth-middleware';

const logger = createComponentLogger('streak-freeze-api');

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ('response' in auth) return auth.response;
  const supabaseAdmin = getSupabaseAdmin();
  const userId = auth.context.user.id;
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
  try {
    const auth = await requireAuth(req);
    if ('response' in auth) return auth.response;
    const userId = auth.context.user.id;
    const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const successUrl = `${origin}/dashboard?streak_frozen=true`;
    const cancelUrl = `${origin}/dashboard`;

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
