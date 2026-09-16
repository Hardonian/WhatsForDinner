import { getTenantContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    // Authenticate and get tenant context (validates user access)
    const tenantResult = await getTenantContext(req);
    if (!tenantResult.success) {
      return tenantResult.response;
    }

    const { context, tenantId } = tenantResult;
    const { supabase } = context;

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';
    const periodDays = parsePeriod(period);
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get partner revenue data
    const { data: revenueData } = await supabase
      .from('api_usage_tracking')
      .select('revenue_usd, timestamp')
      .eq('tenant_id', tenantId)
      .gte('timestamp', startDate.toISOString());

    // Get previous period for comparison
    const previousStartDate = new Date(
      startDate.getTime() - periodDays * 24 * 60 * 60 * 1000
    );
    const { data: previousRevenueData } = await supabase
      .from('api_usage_tracking')
      .select('revenue_usd, timestamp')
      .eq('tenant_id', tenantId)
      .gte('timestamp', previousStartDate.toISOString())
      .lt('timestamp', startDate.toISOString());

    // Get request data
    const { data: requestData } = await supabase
      .from('api_usage_tracking')
      .select('timestamp')
      .eq('tenant_id', tenantId)
      .gte('timestamp', startDate.toISOString());

    const { data: previousRequestData } = await supabase
      .from('api_usage_tracking')
      .select('timestamp')
      .eq('tenant_id', tenantId)
      .gte('timestamp', previousStartDate.toISOString())
      .lt('timestamp', startDate.toISOString());

    // Get active users
    const { data: userData } = await supabase
      .from('api_usage_tracking')
      .select('user_id')
      .eq('tenant_id', tenantId)
      .gte('timestamp', startDate.toISOString());

    const uniqueUsers = new Set(
      userData?.map(record => record.user_id).filter(Boolean) || []
    );

    // Calculate statistics
    const totalRevenue =
      revenueData?.reduce((sum, record) => sum + record.revenue_usd, 0) || 0;
    const previousTotalRevenue =
      previousRevenueData?.reduce(
        (sum, record) => sum + record.revenue_usd,
        0
      ) || 0;
    const revenueGrowth =
      previousTotalRevenue > 0
        ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100
        : 0;

    const totalRequests = requestData?.length || 0;
    const previousTotalRequests = previousRequestData?.length || 0;
    const requestGrowth =
      previousTotalRequests > 0
        ? ((totalRequests - previousTotalRequests) / previousTotalRequests) *
          100
        : 0;

    const activeUsers = uniqueUsers.size;

    // Calculate conversion rate (simplified)
    const { data: subscriptionData } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    const conversionRate =
      activeUsers > 0 ? (subscriptionData?.length || 0) / activeUsers : 0;

    const stats = {
      totalRevenue,
      totalRequests,
      activeUsers,
      conversionRate,
      revenueGrowth,
      requestGrowth,
      period,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    // Error handled: Error fetching partner stats:
    return NextResponse.json(
      { error: 'Failed to fetch partner statistics' },
      { status: 500 }
    );
  }
}

function parsePeriod(period: string): number {
  const periodMap: Record<string, number> = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '1y': 365,
  };
  return periodMap[period] || 30;
}

export const dynamic = "force-dynamic";
