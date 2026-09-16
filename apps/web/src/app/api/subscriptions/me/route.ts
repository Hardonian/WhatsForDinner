import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createComponentLogger } from '@whats-for-dinner/utils';
import { handleApiError } from '@whats-for-dinner/utils';
import { monitorQuery } from '@/lib/performance/query-optimizer';
import Stripe from 'stripe';
import { withTelemetry } from '@/lib/telemetry/api-middleware';

const _logger = createComponentLogger('subscriptions-me-api');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handler(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optimize: Get user's Stripe customer ID with query monitoring
    const userResult = await monitorQuery('get-user-stripe-id', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    });
    
    const user = userResult.result;

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ subscription: null });
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ subscription: null });
    }

    const subscription = subscriptions.data[0];

    return NextResponse.json({
      id: subscription.id,
      plan: subscription.items.data[0]?.price.id?.includes('premium')
        ? 'premium'
        : 'pro',
      status: subscription.status,
      currentPeriodEnd: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error) {
    _logger.error('Failed to get subscription', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error, {
      component: 'subscriptions-me-api',
      context: { endpoint: '/api/subscriptions/me' },
    });
  }
}

export const GET = withTelemetry(handler);
