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

    // Get revenue data grouped by day
    const { data: revenueData } = await supabase
      .from('api_usage_tracking')
      .select('revenue_usd, timestamp')
      .eq('tenant_id', tenantId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: true });

    // Group by date
    const dailyRevenue = new Map();
    const dailyRequests = new Map();
    const dailyUsers = new Set();

    revenueData?.forEach(record => {
      const date = record.timestamp.split('T')[0];

      if (!dailyRevenue.has(date)) {
        dailyRevenue.set(date, 0);
        dailyRequests.set(date, 0);
      }

      dailyRevenue.set(date, dailyRevenue.get(date) + record.revenue_usd);
      dailyRequests.set(date, dailyRequests.get(date) + 1);

      // Note: user_id not available in revenue data
    });

    // Convert to array format
    const revenueChartData = Array.from(dailyRevenue.entries()).map(
      ([date, revenue]) => ({
        date,
        revenue,
        requests: dailyRequests.get(date) || 0,
        users: (Array.from(dailyUsers) as string[]).filter(user => user.startsWith(date))
          .length,
      })
    );

    // Get revenue by partner type
    const { data: partnerRevenueData } = await supabase
      .from('api_usage_tracking')
      .select('revenue_usd, partner_id')
      .eq('tenant_id', tenantId)
      .gte('timestamp', startDate.toISOString());

    // Get partner information
    const partnerIds = [
      ...new Set(
        partnerRevenueData?.map(record => record.partner_id).filter(Boolean) ||
          []
      ),
    ];
    const { data: partners } = await supabase
      .from('partner_registry')
      .select('id, name, type, revenue_share_percent')
      .in('id', partnerIds);

    // Calculate revenue by partner type
    const revenueByType = new Map();
    partnerRevenueData?.forEach(record => {
      const partner = partners?.find(p => p.id === record.partner_id);
      if (partner) {
        const type = partner.type;
        if (!revenueByType.has(type)) {
          revenueByType.set(type, { revenue: 0, partners: new Set() });
        }
        const typeData = revenueByType.get(type);
        typeData.revenue += record.revenue_usd;
        typeData.partners.add(partner.id);
      }
    });

    const revenueByTypeArray = Array.from(revenueByType.entries()).map(
      ([type, data]) => ({
        type,
        revenue: data.revenue,
        partnerCount: data.partners.size,
      })
    );

    // Get top performing partners
    const partnerStats = new Map();
    partnerRevenueData?.forEach(record => {
      const partner = partners?.find(p => p.id === record.partner_id);
      if (partner) {
        if (!partnerStats.has(partner.id)) {
          partnerStats.set(partner.id, {
            name: partner.name,
            type: partner.type,
            revenue: 0,
            requests: 0,
          });
        }
        const stats = partnerStats.get(partner.id);
        stats.revenue += record.revenue_usd;
        stats.requests += 1;
      }
    });

    const topPartners = Array.from(partnerStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const data = {
      chartData: revenueChartData,
      revenueByType: revenueByTypeArray,
      topPartners,
      totalRevenue: revenueChartData.reduce((sum, day) => sum + day.revenue, 0),
      totalRequests: revenueChartData.reduce(
        (sum, day) => sum + day.requests,
        0
      ),
      period,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    // Error handled: Error fetching partner revenue:
    return NextResponse.json(
      { error: 'Failed to fetch partner revenue data' },
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
