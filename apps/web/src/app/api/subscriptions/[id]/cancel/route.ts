import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAuthenticatedUser } from '@/lib/auth-middleware';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('subscription-cancel-api');

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id: subscriptionId } = await context.params;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    // Authenticate the caller
    const authContext = await getAuthenticatedUser(req);
    const authenticatedUser = authContext?.user;

    const userId = authenticatedUser?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    logger.info('Processing subscription cancellation request', { subscriptionId, userId });

    let stripeSubscriptionId = subscriptionId;
    let dbSub: any = null;

    const { data, error: lookupError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .or(`id.eq.${subscriptionId},stripe_subscription_id.eq.${subscriptionId}`)
      .maybeSingle();
    if (lookupError) throw lookupError;
    dbSub = data;
    if (!dbSub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    if (dbSub.stripe_subscription_id) {
      stripeSubscriptionId = dbSub.stripe_subscription_id;
    }

    // Verify ownership and authorization
    if (dbSub) {
      const isOwner = dbSub.user_id === userId;
      if (!isOwner) {
        logger.warn('Unauthorized subscription cancellation attempt', {
          subscriptionId,
          callerUserId: userId,
          ownerUserId: dbSub.user_id,
        });
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to cancel this subscription' },
          { status: 403 }
        );
      }
    }

    // Attempt cancellation via Stripe if it looks like a Stripe subscription ID
    if (!stripeSubscriptionId.startsWith('sub_')) {
      return NextResponse.json({ error: 'Subscription is not linked to Stripe' }, { status: 409 });
    }
    await StripeService.cancelSubscription(stripeSubscriptionId, false);

    // Update database status with tenant-scoped query
    const { error: updateError } = await supabaseAdmin
      .from('subscriptions')
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq('id', dbSub.id);
    if (updateError) throw updateError;

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
