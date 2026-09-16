import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('name');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    if (!metricName) {
      return new Response(
        JSON.stringify({
          error: 'Metric name is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const metrics = await monitoringSystem.getMetrics(
      metricName,
      startTime || undefined,
      endTime || undefined
    );

    return new Response(
      JSON.stringify({
        metric: metricName,
        data: metrics,
        count: metrics.length,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, tags = {}, metadata = {} } = body;

    if (!name || value === undefined) {
      return new Response(
        JSON.stringify({
          error: 'Metric name and value are required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    await monitoringSystem.recordMetric(name, value, tags, metadata);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Metric recorded successfully',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
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
