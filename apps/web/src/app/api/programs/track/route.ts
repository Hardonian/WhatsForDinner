import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { program_type, program_id, event_type, user_id, session_id, metadata } = body;

    // Validate input
    if (!program_type || !program_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: program_type, program_id, event_type' },
        { status: 400 }
      );
    }

    // Track analytics event
    const { error } = await supabase.from('program_analytics').insert({
      program_type,
      program_id,
      event_type,
      user_id: user_id || null,
      metadata: metadata || {},
    });

    if (error) {
      logger.error('Failed to track program event:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'Failed to track event' },
        { status: 500 }
      );
    }

    // Handle conversion events
    if (event_type === 'conversion') {
      await handleConversion(supabase, program_type, program_id, user_id, metadata);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Program tracking error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleConversion(
  supabase: any,
  programType: string,
  programId: string,
  userId: string | null,
  metadata: Record<string, unknown>
) {
  if (programType === 'referral' && userId) {
    // Update referral status
    await supabase
      .from('referrals')
      .update({
        status: 'completed',
        conversion_event: 'subscription',
        conversion_date: new Date().toISOString(),
      })
      .eq('id', programId);

    // Create reward
    const { data: referral } = await supabase
      .from('referrals')
      .select('referrer_id, referrer_reward_type, referrer_reward_amount')
      .eq('id', programId)
      .single();

    if (referral) {
      await supabase.from('referral_rewards').insert({
        referral_id: programId,
        user_id: referral.referrer_id,
        reward_type: referral.referrer_reward_type,
        amount: referral.referrer_reward_amount,
        status: 'pending',
      });
    }
  } else if (programType === 'affiliate' && userId) {
    // Create affiliate conversion
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('commission_rate, commission_type')
      .eq('id', programId)
      .single();

    if (affiliate) {
      const revenueAmount = (metadata.revenue_amount as number) || 0;
      const commissionAmount = (revenueAmount * affiliate.commission_rate) / 100;

      await supabase.from('affiliate_conversions').insert({
        affiliate_id: programId,
        user_id: userId,
        conversion_type: 'subscription',
        commission_amount: commissionAmount,
        commission_rate: affiliate.commission_rate,
        revenue_amount: revenueAmount,
        status: 'pending',
      });

      // Update affiliate earnings
      await supabase.rpc('increment_affiliate_earnings', {
        affiliate_id: programId,
        amount: commissionAmount,
      });
    }
  }
}

export const dynamic = "force-dynamic";
