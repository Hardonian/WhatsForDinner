import { headers } from 'next/headers';

// Webhook routes need service role access (no user auth)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function handler(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = (await headers()).get('stripe-signature');

    if (!signature) {
      logger.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = StripeService.verifyWebhookSignature(body, signature);
    } catch (err) {
      logger.error('Webhook signature verification failed:', { error: err });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Check if we've already processed this event
    const { data: existingEvent } = await supabaseAdmin
      .from('billing_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
            return NextResponse.json({ received: true });
    }

    // Store the event
    await supabaseAdmin.from('billing_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
      data: event,
    });

    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
            }

    // Mark event as processed
    await supabaseAdmin
      .from('billing_events')
      .update({ processed: true })
      .eq('stripe_event_id', event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    // Error handled: Webhook error:
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const { tenantId, userId, plan } = session.metadata;

  if (!tenantId || !userId || !plan) {
    logger.error('Missing metadata in checkout session:', { metadata: session.metadata });
    return;
  }

  // Update tenant with Stripe customer ID
  await supabaseAdmin
    .from('tenants')
    .update({
      stripe_customer_id: session.customer,
    })
    .eq('id', tenantId);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const { tenantId, userId, plan } = subscription.metadata;

  if (!tenantId || !userId || !plan) {
    logger.error('Missing metadata in subscription:', { metadata: subscription.metadata });
    return;
  }

  // Create subscription record
  await supabaseAdmin.from('subscriptions').insert({
    user_id: userId,
    tenant_id: tenantId,
    stripe_customer_id: subscription.customer,
    stripe_subscription_id: subscription.id,
    plan: plan,
    status: subscription.status,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    metadata: subscription,
  });

  // Update tenant plan
  await supabaseAdmin
    .from('tenants')
    .update({
      plan: plan,
      stripe_subscription_id: subscription.id,
      status: 'active',
    })
    .eq('id', tenantId);

  }

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const { tenantId } = subscription.metadata;

  if (!tenantId) {
    logger.error('Missing tenantId in subscription metadata');
    return;
  }

  // Update subscription record
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(
        subscription.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(
        subscription.current_period_end * 1000
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      metadata: subscription,
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update tenant status if subscription is cancelled
  if (subscription.status === 'canceled') {
    await supabaseAdmin
      .from('tenants')
      .update({
        plan: 'free',
        status: 'inactive',
      })
      .eq('id', tenantId);
  }

  }

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const { tenantId } = subscription.metadata;

  if (!tenantId) {
    logger.error('Missing tenantId in subscription metadata');
    return;
  }

  // Update subscription record
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
    })
    .eq('stripe_subscription_id', subscription.id);

  // Downgrade tenant to free plan
  await supabaseAdmin
    .from('tenants')
    .update({
      plan: 'free',
      status: 'inactive',
    })
    .eq('id', tenantId);

  }

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription
  );
  const { tenantId } = subscription.metadata;

  if (!tenantId) {
    logger.error('Missing tenantId in subscription metadata');
    return;
  }

  // Update tenant status to active
  await supabaseAdmin
    .from('tenants')
    .update({
      status: 'active',
    })
    .eq('id', tenantId);

  }

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(
    invoice.subscription
  );
  const { tenantId } = subscription.metadata;

  if (!tenantId) {
    logger.error('Missing tenantId in subscription metadata');
    return;
  }

  // Update tenant status to suspended
  await supabaseAdmin
    .from('tenants')
    .update({
      status: 'suspended',
    })
    .eq('id', tenantId);

  }

export const dynamic = "force-dynamic";
