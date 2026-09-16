import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const metricNames = searchParams.get('metrics')?.split(',') || [
      'error_rate',
      'response_time_ms',
      'memory_usage_percent',
      'cpu_usage_percent',
      'ai_cost_per_hour',
      'api_requests',
      'api_errors',
      'security_events',
    ];

    const metrics: Record<string, any[]> = {};

    for (const metricName of metricNames) {
      metrics[metricName] = await monitoringSystem.getMetrics(
        metricName,
        startTime || undefined,
        endTime || undefined
      );
    }

    // Calculate summary statistics
    const summary = Object.entries(metrics).reduce(
      (acc, [name, data]) => {
        if (data.length === 0) {
          acc[name] = { count: 0, average: 0, min: 0, max: 0, latest: 0 };
          return acc;
        }

        const values = data.map(d => d.value);
        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const latest = values[values.length - 1];

        acc[name] = { count: data.length, average, min, max, latest };
        return acc;
      },
      {} as Record<string, unknown>
    );

    return new Response(
      JSON.stringify({
        metrics,
        summary,
        period: {
          startTime:
            startTime ||
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          endTime: endTime || new Date().toISOString(),
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export const dynamic = "force-dynamic";
