import { NextResponse } from 'next/server';

export async function GET() {
  const start = Date.now();
  
  try {
    // Import queue health check dynamically (server-side only)
    // Note: This requires the server package to be available in the web app
    let health;
    try {
      const queueModule = await import('@whats-for-dinner/server/queue/health');
      health = await queueModule.checkQueueHealth();
    } catch (importError) {
      // Fallback if server package not available
      health = {
        healthy: false,
        worker: {
          running: false,
          active: 0,
          waiting: 0,
          completed: 0,
          failed: 0,
          paused: false,
        },
        redis: {
          connected: false,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    const responseTime = Date.now() - start;
    
    return NextResponse.json({
      ...health,
      responseTime,
    }, {
      status: health.healthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    // If queue module is not available, return unhealthy
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Queue health check unavailable',
      responseTime: Date.now() - start,
      worker: {
        running: false,
        active: 0,
        waiting: 0,
        completed: 0,
        failed: 0,
        paused: false,
      },
      redis: {
        connected: false,
      },
    }, { status: 503 });
  }
}

export const dynamic = "force-dynamic";
