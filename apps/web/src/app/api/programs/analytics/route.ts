import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const programType = searchParams.get('type'); // 'referral' | 'affiliate' | 'partner'
    const programId = searchParams.get('id');
    const period = searchParams.get('period') || '30'; // days

    if (!programType || !programId) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - parseInt(period));

    // Get analytics data
    const { data: analytics } = await supabase
      .from('program_analytics')
      .select('*')
      .eq('program_type', programType)
      .eq('program_id', programId)
      .gte('created_at', periodStart.toISOString());

    // Aggregate metrics
    const metrics = {
      total_clicks: analytics?.filter((a) => a.event_type === 'click').length || 0,
      total_signups: analytics?.filter((a) => a.event_type === 'signup').length || 0,
      total_conversions: analytics?.filter((a) => a.event_type === 'conversion').length || 0,
      conversion_rate: 0,
      click_to_signup_rate: 0,
    };

    if (metrics.total_clicks > 0) {
      metrics.click_to_signup_rate = (metrics.total_signups / metrics.total_clicks) * 100;
      metrics.conversion_rate = (metrics.total_conversions / metrics.total_signups) * 100;
    }

    // Get revenue data if affiliate or partner
    let revenueData = null;
    if (programType === 'affiliate') {
      const { data: conversions } = await supabase
        .from('affiliate_conversions')
        .select('revenue_amount, commission_amount')
        .eq('affiliate_id', programId)
        .gte('created_at', periodStart.toISOString());

      if (conversions) {
        revenueData = {
          total_revenue: conversions.reduce((sum, c) => sum + (c.revenue_amount || 0), 0),
          total_commission: conversions.reduce((sum, c) => sum + (c.commission_amount || 0), 0),
        };
      }
    }

    return NextResponse.json({
      metrics,
      revenue: revenueData,
      period_days: parseInt(period),
    });
  } catch (error) {
    logger.error('Analytics error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
