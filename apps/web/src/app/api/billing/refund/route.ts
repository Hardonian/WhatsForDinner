import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription_id, reason, amount } = body;

    if (!subscription_id) {
      return NextResponse.json({ error: 'Missing subscription_id' }, { status: 400 });
    }

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, invoices(*)')
      .eq('id', subscription_id)
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Check if within 30-day refund window
    const purchaseDate = new Date(subscription.created_at);
    const daysSincePurchase = Math.floor(
      (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSincePurchase > 30) {
      return NextResponse.json(
        { error: 'Refund window expired. Refunds must be requested within 30 days.' },
        { status: 400 }
      );
    }

    // Calculate refund amount
    const refundAmount = amount || subscription.metadata?.amount || 0;
    const refundAmountCents = Math.round(refundAmount * 100);

    // Process refund through Stripe
    let refundId: string | null = null;
    if (subscription.stripe_subscription_id) {
      try {
        // Get the payment intent or charge
        const charges = await stripe.charges.list({
          customer: subscription.stripe_customer_id || undefined,
          limit: 1,
        });

        if (charges.data.length > 0) {
          const refund = await stripe.refunds.create({
            charge: charges.data[0].id,
            amount: refundAmountCents,
            reason: reason || 'requested_by_customer',
            metadata: {
              user_id: user.id,
              subscription_id: subscription_id,
            },
          });

          refundId = refund.id;
        }
      } catch (stripeError) {
        logger.error('Stripe refund error:', { stripeError });
        return NextResponse.json(
          { error: 'Failed to process refund through payment processor' },
          { status: 500 }
        );
      }
    }

    // Create refund record
    const { data: refundRecord, error: refundError } = await supabase
      .from('refunds')
      .insert({
        user_id: user.id,
        subscription_id: subscription_id,
        amount: refundAmount,
        reason: reason || 'requested_by_customer',
        status: refundId ? 'processed' : 'pending',
        stripe_refund_id: refundId,
        metadata: {
          days_since_purchase: daysSincePurchase,
        },
      })
      .select()
      .single();

    if (refundError) {
      return NextResponse.json(
        { error: 'Failed to create refund record' },
        { status: 500 }
      );
    }

    // Cancel subscription if full refund
    if (refundAmount >= subscription.metadata?.amount) {
      await supabase
        .from('subscriptions')
        .update({
          status: 'canceled',
          cancel_at_period_end: false,
        })
        .eq('id', subscription_id);
    }

    return NextResponse.json({
      success: true,
      refund: refundRecord,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    logger.error('Refund processing error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's refunds
    const { data: refunds, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 });
    }

    return NextResponse.json({ refunds: refunds || [] });
  } catch (error) {
    logger.error('Refund fetch error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
