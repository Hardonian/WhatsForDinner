import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get affiliate info
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!affiliate) {
      return NextResponse.json({ error: 'Not an affiliate' }, { status: 404 });
    }

    // Get stats
    const [clicksResult, conversionsResult, commissionsResult] = await Promise.all([
      supabase
        .from('affiliate_clicks')
        .select('id', { count: 'exact' })
        .eq('affiliate_id', affiliate.id),
      supabase
        .from('affiliate_conversions')
        .select('amount, commission', { count: 'exact' })
        .eq('affiliate_id', affiliate.id),
      supabase
        .from('affiliate_commissions')
        .select('amount', { count: 'exact' })
        .eq('affiliate_id', affiliate.id)
        .eq('status', 'paid'),
    ]);

    const clicks = clicksResult.count || 0;
    const conversions = conversionsResult.count || 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const totalRevenue = conversionsResult.data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const totalCommissions = commissionsResult.data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const pendingCommissions = (conversionsResult.data?.reduce((sum, c) => sum + (c.commission || 0), 0) || 0) - totalCommissions;

    return NextResponse.json({
      affiliate: {
        code: affiliate.affiliate_code,
        link: affiliate.referral_link,
        commissionRate: affiliate.commission_rate,
        status: affiliate.status,
      },
      stats: {
        clicks,
        conversions,
        conversionRate: conversionRate.toFixed(2),
        totalRevenue,
        totalCommissions,
        pendingCommissions,
      },
      recentConversions: conversionsResult.data?.slice(0, 10) || [],
    });
  } catch (error) {
    logger.error('Affiliate dashboard error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to load dashboard' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
