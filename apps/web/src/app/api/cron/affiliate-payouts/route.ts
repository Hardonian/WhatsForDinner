import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const MIN_PAYOUT = parseFloat(process.env.AFFILIATE_MIN_PAYOUT || '50');

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient();

    // Get all affiliates with pending commissions >= minimum payout
    const { data: affiliates } = await supabase
      .from('affiliates')
      .select(`
        id,
        user_id,
        affiliate_commissions!inner(amount, status)
      `)
      .eq('affiliate_commissions.status', 'pending');

    const payouts = [];

    for (const affiliate of affiliates || []) {
      const { data: commissions } = await supabase
        .from('affiliate_commissions')
        .select('amount')
        .eq('affiliate_id', affiliate.id)
        .eq('status', 'pending');

      const totalPending = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      if (totalPending >= MIN_PAYOUT) {
        // Get user's Stripe account
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_account_id')
          .eq('id', affiliate.user_id)
          .single();

        if (profile?.stripe_account_id) {
          // Create payout via Stripe
          const transfer = await stripe.transfers.create({
            amount: Math.round(totalPending * 100), // Convert to cents
            currency: 'usd',
            destination: profile.stripe_account_id,
            metadata: {
              affiliate_id: affiliate.id,
              type: 'affiliate_commission',
            },
          });

          // Update commission status
          await supabase
            .from('affiliate_commissions')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('affiliate_id', affiliate.id)
            .eq('status', 'pending');

          payouts.push({
            affiliateId: affiliate.id,
            amount: totalPending,
            transferId: transfer.id,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      payoutsProcessed: payouts.length,
      payouts,
    });
  } catch (error) {
    logger.error('Affiliate payout error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to process payouts' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
