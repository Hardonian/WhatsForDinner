import { observabilitySystem } from '@/lib/observability';

export async function GET() {
  try {
    // Get system health
    const systemHealth = await monitoringSystem.getHealthStatus();

    // Get observability health
    const observabilityHealth = await observabilitySystem.getSystemHealth();

    // Combine health information
    const health = {
      timestamp: new Date().toISOString(),
      overall:
        systemHealth.status === 'unhealthy' ||
        observabilityHealth.status === 'unhealthy'
          ? 'unhealthy'
          : systemHealth.status === 'degraded' ||
              observabilityHealth.status === 'degraded'
            ? 'degraded'
            : 'healthy',
      system: systemHealth,
      observability: observabilityHealth,
      components: {
        monitoring: systemHealth.status,
        tracing: observabilityHealth.components.tracing?.status || 'unknown',
        logging: observabilityHealth.components.logging?.status || 'unknown',
        database: observabilityHealth.components.database?.status || 'unknown',
      },
      summary: {
        activeAlerts: systemHealth.alerts.length,
        criticalAlerts: systemHealth.alerts.filter(
          a => a.severity === 'critical'
        ).length,
        errorRate: systemHealth.metrics.errorRate || 0,
        responseTime: systemHealth.metrics.responseTime || 0,
        uptime: systemHealth.metrics.uptime || 0,
      },
    };

    return new Response(JSON.stringify(health), {
      status: health.overall === 'unhealthy' ? 503 : 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        overall: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        system: { status: 'unhealthy', alerts: [], metrics: {} },
        observability: { status: 'unhealthy', components: {}, metrics: {} },
      }),
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
