import { withTelemetry } from '@/lib/telemetry/api-middleware';

export const runtime = 'edge';
export const revalidate = 60; // Cache for 60 seconds

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MetricData {
  source: string;
  metric: Record<string, unknown>;
  ts: string;
}

async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Fetch recent metrics
    const { data: metrics, error } = await supabase
      .from('metrics_log')
      .select('source, metric, ts')
      .gte('ts', startTime)
      .order('ts', { ascending: false })
      .limit(1000);

    if (error) {
      logger.error('Error fetching metrics:', { error: error instanceof Error ? error.message : String(error) });
      return NextResponse.json(
        { error: 'Failed to fetch metrics', details: error.message },
        { status: 500 }
      );
    }

    // Aggregate by source
    const aggregated: Record<string, unknown> = {
      performance: {
        webVitals: { LCP: 0, CLS: 0, TTFB: 0, FID: 0 },
        supabase: { avgLatencyMs: 0, queryCount: 0 },
        expo: { bundleMB: 0, buildDurationMin: 0 },
        ci: { avgBuildMin: 0, successRate: 0 },
      },
      status: 'healthy',
      lastUpdated: new Date().toISOString(),
      trends: {},
    };

    const sourceGroups: Record<string, MetricData[]> = {};
    metrics?.forEach((m) => {
      if (!sourceGroups[m.source]) {
        sourceGroups[m.source] = [];
      }
      sourceGroups[m.source].push(m);
    });

    // Process Vercel metrics (web vitals)
    if (sourceGroups['vercel']) {
      const vercelMetrics = sourceGroups['vercel']
        .map((m) => m.metric)
        .filter((m) => m.LCP || m.CLS || m.TTFB || m.FID);

      if (vercelMetrics.length > 0) {
        aggregated.performance.webVitals = {
          LCP:
            vercelMetrics.reduce((sum, m) => sum + (m.LCP || 0), 0) /
            vercelMetrics.length,
          CLS:
            vercelMetrics.reduce((sum, m) => sum + (m.CLS || 0), 0) /
            vercelMetrics.length,
          TTFB:
            vercelMetrics.reduce((sum, m) => sum + (m.TTFB || 0), 0) /
            vercelMetrics.length,
          FID:
            vercelMetrics.reduce((sum, m) => sum + (m.FID || 0), 0) /
            vercelMetrics.length,
        };
      }
    }

    // Process Supabase metrics
    if (sourceGroups['supabase']) {
      const supabaseMetrics = sourceGroups['supabase']
        .map((m) => m.metric)
        .filter((m) => m.latencyMs || m.queryTime);

      if (supabaseMetrics.length > 0) {
        aggregated.performance.supabase = {
          avgLatencyMs:
            supabaseMetrics.reduce(
              (sum, m) => sum + (m.latencyMs || m.queryTime || 0),
              0
            ) / supabaseMetrics.length,
          queryCount: supabaseMetrics.length,
        };
      }
    }

    // Process Expo metrics
    if (sourceGroups['expo']) {
      const expoMetrics = sourceGroups['expo']
        .map((m) => m.metric)
        .filter((m) => m.bundleSizeMB || m.buildDuration);

      if (expoMetrics.length > 0) {
        aggregated.performance.expo = {
          bundleMB:
            expoMetrics.reduce((sum, m) => sum + (m.bundleSizeMB || 0), 0) /
            expoMetrics.length,
          buildDurationMin:
            expoMetrics.reduce((sum, m) => sum + (m.buildDuration || 0), 0) /
            expoMetrics.length /
            60,
        };
      }
    }

    // Process GitHub CI metrics
    if (sourceGroups['github']) {
      const ciMetrics = sourceGroups['github']
        .map((m) => m.metric)
        .filter((m) => m.duration || m.conclusion);

      if (ciMetrics.length > 0) {
        const successful = ciMetrics.filter((m) => m.conclusion === 'success')
          .length;
        aggregated.performance.ci = {
          avgBuildMin:
            ciMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) /
            ciMetrics.length /
            60,
          successRate: (successful / ciMetrics.length) * 100,
        };
      }
    }

    // Calculate 7-day moving average trends
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recent = metrics?.filter((m) => new Date(m.ts) >= sevenDaysAgo) || [];
    const older = metrics?.filter((m) => new Date(m.ts) < sevenDaysAgo) || [];

    if (recent.length > 0 && older.length > 0) {
      // Simple trend calculation
      aggregated.trends = {
        recordCount: {
          current: recent.length,
          previous: older.length,
          change: ((recent.length - older.length) / older.length) * 100,
        },
      };
    }

    // Determine overall status
    const hasRegressions =
      aggregated.performance.webVitals.LCP > 2.5 ||
      aggregated.performance.webVitals.CLS > 0.1 ||
      aggregated.performance.supabase.avgLatencyMs > 500 ||
      aggregated.performance.ci.successRate < 90;

    aggregated.status = hasRegressions ? 'degraded' : 'healthy';

    return NextResponse.json(aggregated, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    logger.error('Dashboard error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      {
        error: 'Failed to generate dashboard',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const GET = withTelemetry(handler);

export const dynamic = "force-dynamic";
