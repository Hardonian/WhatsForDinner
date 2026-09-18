import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('subscription-me-api');

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.headers.get('authorization');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { data: dbSub, error: dbError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError) {
        logger.warn('Error fetching subscription for user', { userId, error: dbError.message });
      }

      if (dbSub) {
        return NextResponse.json({
          subscription: {
            id: dbSub.id || dbSub.stripe_subscription_id,
            plan: dbSub.plan || 'pro',
            status: dbSub.status || 'active',
            currentPeriodEnd: dbSub.current_period_end || new Date(Date.now() + 30 * 86400000).toISOString(),
            cancelAtPeriodEnd: Boolean(dbSub.cancel_at_period_end),
            stripeSubscriptionId: dbSub.stripe_subscription_id,
          },
        });
      }
    } catch (err: any) {
      logger.warn('Failed to query database for subscription', { error: err?.message });
    }

    return NextResponse.json({ subscription: null });
  } catch (err: any) {
    logger.error('Unexpected error in subscriptions/me', { error: err });
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ status: 'ok', stub: true });
}

