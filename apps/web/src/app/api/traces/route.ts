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

    return new Response(
      JSON.stringify({
        traces,
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
        error: error.message,
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
