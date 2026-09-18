import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '../../../../../lib/stripe';
import { supabaseAdmin } from '../../../../../lib/supabaseClient';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('subscription-cancel-api');

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const subscriptionId = resolvedParams?.id;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    const userId = req.headers.get('x-user-id') || req.headers.get('authorization');
    logger.info('Processing subscription cancellation request', { subscriptionId, userId });

    let stripeSubscriptionId = subscriptionId;

    // Check if subscriptionId corresponds to a database record
    try {
      const { data: dbSub } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .or(`id.eq.${subscriptionId},stripe_subscription_id.eq.${subscriptionId}`)
        .maybeSingle();

      if (dbSub?.stripe_subscription_id) {
        stripeSubscriptionId = dbSub.stripe_subscription_id;
      }
    } catch (dbErr) {
      logger.warn('Could not query database for subscription', { error: dbErr });
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

    // Update database status
    try {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${subscriptionId},stripe_subscription_id.eq.${subscriptionId}`);
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
