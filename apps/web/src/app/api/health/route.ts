import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
import {
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-dynamic";
  runHealthCheck,
  createLivenessHandler,
  createReadinessHandler,
  HealthCheckOptions,
} from '@whats-for-dinner/utils';

/**
 * Full health check endpoint
 * Returns comprehensive health status with all checks
 */
export async function GET(req: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const includeDetails = searchParams.get('details') === 'true';
    const checkTimeout = parseInt(searchParams.get('timeout') || '5000', 10);

    const options: HealthCheckOptions = {
      includeDetails,
      checkTimeout,
    };

    // Add custom checks if needed
    // options.customChecks = {
    //   customCheck: async () => {
    //     // Your custom check logic
    //     return { status: 'pass', message: 'Custom check passed' };
    //   },
    // };

    const health = await runHealthCheck(options);

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 200 :
                      503;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check-Timestamp': health.timestamp,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check execution failed',
        details: process.env.NODE_ENV === 'development'
          ? { error: error instanceof Error ? error.message : String(error) }
          : undefined,
      },
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export const dynamic = "force-dynamic";
