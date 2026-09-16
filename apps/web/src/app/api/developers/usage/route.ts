import { requireAuth } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user via JWT
    const authResult = await requireAuth(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { context } = authResult;
    const { user, supabase } = context;

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30d';
    const periodDays = parsePeriod(period);
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

    // Get API usage data
    const { data: usageData, error } = await supabase
      .from('api_usage_tracking')
      .select('cost_usd, response_time_ms, status_code, endpoint, method')
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch usage data: ${error.message}`);
    }

    // Calculate usage statistics
    const totalRequests = usageData?.length || 0;
    const totalCost =
      usageData?.reduce((sum, record) => sum + record.cost_usd, 0) || 0;
    const averageResponseTime =
      usageData?.length > 0
        ? usageData.reduce((sum, record) => sum + record.response_time_ms, 0) /
          usageData.length
        : 0;
    const successRate =
      usageData?.length > 0
        ? usageData.filter(record => record.status_code < 400).length /
          usageData.length
        : 0;

    // Calculate top endpoints
    const endpointStats = new Map();
    usageData?.forEach(record => {
      const key = `${record.method} ${record.endpoint}`;
      if (!endpointStats.has(key)) {
        endpointStats.set(key, { requests: 0, cost: 0 });
      }
      const stats = endpointStats.get(key);
      stats.requests++;
      stats.cost += record.cost_usd;
    });

    const topEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        requests: stats.requests,
        cost: stats.cost,
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    // Get SDK download statistics
    const { data: sdkDownloads } = await supabase
      .from('sdk_downloads')
      .select('sdk_language, download_count')
      .eq('developer_id', user.id);

    const sdkStats =
      sdkDownloads?.reduce(
        (acc, download) => {
          acc[download.sdk_language] = download.download_count;
          return acc;
        },
        {} as Record<string, number>
      ) || {};

    const usage = {
      totalRequests,
      totalCost,
      averageResponseTime,
      successRate,
      topEndpoints,
      sdkStats,
      period,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error) {
    // Error handled: Error fetching usage data:
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
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
