import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Get or create referral code
    let { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (codeError || !referralCode) {
      // Create new referral code
      const generatedCode = `REF${userId.slice(0, 8).toUpperCase()}`;
      const { data: newCode, error: createError } = await supabase
        .from('referral_codes')
        .insert({
          user_id: userId,
          code: generatedCode,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }
    }

    const referralLink = `${request.nextUrl.origin}/auth?ref=${referralCode.code}`;

    // Get referral stats
    const { data: referrals } = await supabase
      .from('referral_tracking')
      .select('*')
      .eq('referrer_id', userId);

    const { data: activeReferrals } = await supabase
      .from('referral_tracking')
      .select('referee_id')
      .eq('referrer_id', userId);

    // Get rewards earned
    const { data: rewards } = await supabase
      .from('referral_rewards')
      .select('*')
      .eq('user_id', userId);

    return NextResponse.json({
      referralCode: referralCode.code,
      referralLink,
      totalReferrals: referrals?.length || 0,
      activeReferrals: activeReferrals?.length || 0,
      rewardsEarned: rewards?.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch referral data' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
