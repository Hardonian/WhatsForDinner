import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_MONETIZATION!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', { err });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Handle affiliate commission payout
        await handleAffiliatePayout(event.data.object as Stripe.PaymentIntent, supabase);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        // Handle API subscription
        await handleAPISubscription(event.data.object as Stripe.Subscription, supabase);
        break;

      case 'transfer.created':
        // Handle marketplace seller payout
        await handleMarketplacePayout(event.data.object as Stripe.Transfer, supabase);
        break;

      default:
        logger.info('Unhandled event type: ${event.type}');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleAffiliatePayout(
  paymentIntent: Stripe.PaymentIntent,
  supabase: ReturnType<typeof createClient>
) {
  const affiliateId = paymentIntent.metadata?.affiliate_id;
  if (!affiliateId) return;

  await supabase
    .from('affiliate_commissions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payout_id: paymentIntent.id,
    })
    .eq('affiliate_id', affiliateId)
    .eq('status', 'pending');
}

async function handleAPISubscription(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof createClient>
) {
  const userId = subscription.metadata?.user_id;
  const planId = subscription.metadata?.plan_id;
  if (!userId || !planId) return;

  await supabase.from('api_billing').upsert({
    user_id: userId,
    plan_id: planId,
    stripe_subscription_id: subscription.id,
    status: subscription.status === 'active' ? 'active' : 'cancelled',
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  });
}

async function handleMarketplacePayout(
  transfer: Stripe.Transfer,
  supabase: ReturnType<typeof createClient>
) {
  const transactionId = transfer.metadata?.transaction_id;
  if (!transactionId) return;

  await supabase
    .from('marketplace_payouts')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      stripe_transfer_id: transfer.id,
    })
    .eq('transaction_id', transactionId)
    .eq('status', 'pending');
}

export const dynamic = "force-dynamic";
