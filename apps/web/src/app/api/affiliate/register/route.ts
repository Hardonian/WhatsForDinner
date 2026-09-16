import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate unique affiliate code
    const affiliateCode = `AFF${user.id.slice(0, 8).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/ref/${affiliateCode}`;

    // Check if already registered
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        affiliateCode,
        referralLink,
        message: 'Already registered',
      });
    }

    // Register new affiliate
    const { data, error } = await supabase
      .from('affiliates')
      .insert({
        user_id: user.id,
        affiliate_code: affiliateCode,
        referral_link: referralLink,
        commission_rate: parseFloat(process.env.AFFILIATE_COMMISSION_RATE || '10'),
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      affiliateCode,
      referralLink,
      data,
    });
  } catch (error) {
    logger.error('Affiliate registration error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to register affiliate' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
