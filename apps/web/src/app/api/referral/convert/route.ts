import { withTelemetry } from '@/lib/telemetry/api-middleware';

async function handler(request: NextRequest) {
  try {
    const { createClient: createSupabaseClient } = await import('@/lib/supabase/server');
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { referralCode } = await request.json();

    if (!referralCode) {
      return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
    }

    // Find referral
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .eq('reward_status', 'pending')
      .single();

    if (!referral) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    // Check if user is trying to refer themselves
    if (referral.referrer_id === user.id) {
      return NextResponse.json({ error: 'Cannot use your own referral code' }, { status: 400 });
    }

    // Check if referral already converted
    if (referral.invitee_id) {
      return NextResponse.json({ error: 'Referral already used' }, { status: 400 });
    }

    // Update referral with invitee
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        invitee_id: user.id,
        conversion_date: new Date().toISOString(),
        reward_status: 'earned',
      })
      .eq('id', referral.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
    }

    // Award reward to referrer
    if (referral.reward_type === 'pro_extension') {
      // Extend referrer's Pro subscription
      const { data: referrerSubscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', referral.referrer_id)
        .eq('status', 'active')
        .single();

      if (referrerSubscription) {
        const currentEnd = new Date(referrerSubscription.current_period_end || Date.now());
        const newEnd = new Date(currentEnd.getTime() + (referral.reward_value || 30) * 24 * 60 * 60 * 1000);
        
        await supabase
          .from('subscriptions')
          .update({ current_period_end: newEnd.toISOString() })
          .eq('id', referrerSubscription.id);
      }
    }

    // Award reward to invitee (new user)
    if (referral.reward_type === 'pro_extension') {
      // Give new user free Pro trial
      await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan: 'pro',
          status: 'trialing',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + (referral.reward_value || 30) * 24 * 60 * 60 * 1000).toISOString(),
        });
    }

    // Track conversion event
    await supabase.from('analytics_events').insert({
      event_type: 'referral_converted',
      user_id: user.id,
      session_id: request.headers.get('x-session-id') || 'unknown',
      properties: {
        referralCode,
        referrerId: referral.referrer_id,
        rewardType: referral.reward_type,
        rewardValue: referral.reward_value,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      reward: {
        type: referral.reward_type,
        value: referral.reward_value,
        description: 'You and your friend both get 1 month free Pro!',
      },
    });
  } catch (error) {
    logger.error('Referral conversion error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to process referral' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
