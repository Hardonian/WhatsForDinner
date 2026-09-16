import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Process referral rewards
    await processReferralRewards(supabase);

    // Process affiliate payouts
    await processAffiliatePayouts(supabase);

    // Process partner revenue shares
    await processPartnerRevenueShares(supabase);

    return NextResponse.json({ success: true, message: 'Rewards distributed' });
  } catch (error) {
    logger.error('Reward distribution error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processReferralRewards(supabase: any) {
  // Get pending referral rewards
  const { data: rewards } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('status', 'pending');

  if (!rewards || rewards.length === 0) return;

  for (const reward of rewards) {
    // Apply reward based on type
    if (reward.reward_type === 'subscription_days') {
      // Add subscription days to user's account
      await supabase.rpc('add_subscription_days', {
        user_id: reward.user_id,
        days: reward.amount,
      });
    } else if (reward.reward_type === 'credit') {
      // Add credit to user's account
      await supabase.rpc('add_account_credit', {
        user_id: reward.user_id,
        amount: reward.amount,
      });
    }

    // Mark reward as applied
    await supabase
      .from('referral_rewards')
      .update({
        status: 'applied',
        applied_at: new Date().toISOString(),
      })
      .eq('id', reward.id);
  }
}

async function processAffiliatePayouts(supabase: any) {
  // Get affiliates with pending earnings above minimum
  const { data: affiliates } = await supabase
    .from('affiliates')
    .select('*')
    .eq('status', 'approved')
    .gte('pending_earnings', 50); // Minimum payout

  if (!affiliates || affiliates.length === 0) return;

  for (const affiliate of affiliates) {
    // Get pending conversions
    const { data: conversions } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('affiliate_id', affiliate.id)
      .eq('status', 'approved');

    if (!conversions || conversions.length === 0) continue;

    // Create payout record
    const periodEnd = new Date();
    const periodStart = new Date(periodEnd);
    periodStart.setMonth(periodStart.getMonth() - 1);

    const { data: payout } = await supabase
      .from('program_payouts')
      .insert({
        program_type: 'affiliate',
        program_id: affiliate.id,
        amount: affiliate.pending_earnings,
        payout_method: affiliate.payment_method || 'paypal',
        status: 'pending',
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        conversion_ids: conversions.map((c: { id: string }) => c.id),
      })
      .select()
      .single();

    if (payout) {
      // Mark conversions as paid
      await supabase
        .from('affiliate_conversions')
        .update({ status: 'paid', paid_at: new Date().toISOString() })
        .in('id', conversions.map((c: { id: string }) => c.id));

      // Update affiliate earnings
      await supabase
        .from('affiliates')
        .update({
          paid_earnings: affiliate.paid_earnings + affiliate.pending_earnings,
          pending_earnings: 0,
        })
        .eq('id', affiliate.id);
    }
  }
}

async function processPartnerRevenueShares(supabase: any) {
  // Get active partners
  const { data: partners } = await supabase
    .from('partners')
    .select('*')
    .eq('status', 'active');

  if (!partners || partners.length === 0) return;

  // Calculate revenue shares for last month
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd);
  periodStart.setMonth(periodStart.getMonth() - 1);

  for (const partner of partners) {
    // Get subscriptions attributed to this partner
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('status', 'active')
      .gte('created_at', periodStart.toISOString())
      .lte('created_at', periodEnd.toISOString());

    if (!subscriptions || subscriptions.length === 0) continue;

    let totalRevenue = 0;
    for (const sub of subscriptions) {
      // Calculate revenue share based on partner tier
      const shareRate = partner.revenue_share_rate || 0;
      const shareAmount = (sub.metadata?.amount || 0) * (shareRate / 100);

      await supabase.from('partner_revenue_shares').insert({
        partner_id: partner.id,
        subscription_id: sub.id,
        revenue_amount: sub.metadata?.amount || 0,
        share_rate: shareRate,
        share_amount: shareAmount,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        status: 'pending',
      });

      totalRevenue += shareAmount;
    }

    // Update partner pending revenue
    await supabase
      .from('partners')
      .update({
        total_revenue_share_pending: partner.total_revenue_share_pending + totalRevenue,
      })
      .eq('id', partner.id);
  }
}

export const dynamic = "force-dynamic";
