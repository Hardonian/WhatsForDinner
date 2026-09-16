import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (sessionId) filters.sessionId = sessionId;
    if (startTime) filters.startTime = startTime;
    if (endTime) filters.endTime = endTime;
    if (status) filters.status = status;
    if (limit) filters.limit = parseInt(limit);

    const traces = await observabilitySystem.getTraces(filters);

    // Get spans for each trace
    const tracesWithSpans = await Promise.all(
      traces.map(async trace => {
        const spans = await observabilitySystem.getSpans(trace.id);
        return {
          ...trace,
          spans,
        };
      })
    );

    // Calculate statistics
    const stats = {
      total: traces.length,
      completed: traces.filter(t => t.status === 'completed').length,
      error: traces.filter(t => t.status === 'error').length,
      started: traces.filter(t => t.status === 'started').length,
      averageDuration:
        traces.length > 0
          ? traces.reduce((sum, t) => sum + (t.duration || 0), 0) /
            traces.length
          : 0,
    };

    return new Response(
      JSON.stringify({
        traces: tracesWithSpans,
        stats,
        count: traces.length,
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
