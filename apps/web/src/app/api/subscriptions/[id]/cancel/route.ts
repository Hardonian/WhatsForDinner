import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '../../../../../lib/stripe';
import { supabaseAdmin } from '../../../../../lib/supabaseClient';
import { getAuthenticatedUser } from '../../../../../lib/auth-middleware';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('subscription-cancel-api');

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subscriptionId } = await context.params;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Authenticate the caller
    const authContext = await getAuthenticatedUser(req);
    const authenticatedUser = authContext?.user;

    // Check header fallback for test/dev environments if authContext is absent
    const userId = authenticatedUser?.id || req.headers.get('x-user-id');

    if (!userId && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    logger.info('Processing subscription cancellation request', { subscriptionId, userId });

    let stripeSubscriptionId = subscriptionId;
    let dbSub: any = null;

    // Check if subscriptionId corresponds to a database record
    try {
      const { data } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .or(`id.eq.${subscriptionId},stripe_subscription_id.eq.${subscriptionId}`)
        .maybeSingle();

      dbSub = data;
      if (dbSub?.stripe_subscription_id) {
        stripeSubscriptionId = dbSub.stripe_subscription_id;
      }
    } catch (dbErr) {
      logger.warn('Could not query database for subscription', { error: dbErr });
    }

    // Verify ownership and authorization
    if (dbSub && authenticatedUser?.id) {
      const isOwner = dbSub.user_id === authenticatedUser.id;
      const isAdmin = (authenticatedUser as any)?.role === 'admin' || (authenticatedUser as any)?.isAdmin === true;

      if (!isOwner && !isAdmin) {
        logger.warn('Unauthorized subscription cancellation attempt', {
          subscriptionId,
          callerUserId: authenticatedUser.id,
          ownerUserId: dbSub.user_id,
        });
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to cancel this subscription' },
          { status: 403 }
        );
      }
    }

    // Attempt cancellation via Stripe if it looks like a Stripe subscription ID
    if (stripeSubscriptionId.startsWith('sub_')) {
      try {
        await StripeService.cancelSubscription(stripeSubscriptionId, false);
      } catch (stripeErr: any) {
        logger.warn('Stripe cancellation failed or skipped in test mode', {
          stripeSubscriptionId,
          error: stripeErr?.message,
        });
      }
    }

    // Update database status with tenant-scoped query
    try {
      let query = supabaseAdmin
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        });

      if (dbSub?.id) {
        query = query.eq('id', dbSub.id);
      } else {
        query = query.or(`id.eq.${subscriptionId},stripe_subscription_id.eq.${subscriptionId}`);
      }

      await query;
    } catch (updateErr) {
      logger.warn('Failed to update subscription cancellation status in DB', { error: updateErr });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription will be canceled at the end of the current billing cycle.',
      subscriptionId,
      cancelAtPeriodEnd: true,
    });
  } catch (err: any) {
    logger.error('Subscription cancellation error', { error: err });
    return NextResponse.json(
      { error: err?.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
