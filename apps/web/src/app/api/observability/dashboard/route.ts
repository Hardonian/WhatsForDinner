import { performanceOptimizer } from '@/lib/performanceOptimizer';

export async function GET() {
  try {
    // Get system health
    const health = await monitoringSystem.getHealthStatus();

    // Get observability health
    const observabilityHealth = await observabilitySystem.getSystemHealth();

    // Get performance report
    const performanceReport =
      await performanceOptimizer.generatePerformanceReport();

    // Get recent metrics
    const recentMetrics = {
      errorRate: await monitoringSystem.getMetrics('error_rate'),
      responseTime: await monitoringSystem.getMetrics('response_time_ms'),
      memoryUsage: await monitoringSystem.getMetrics('memory_usage_percent'),
      cpuUsage: await monitoringSystem.getMetrics('cpu_usage_percent'),
    };

    // Get recent alerts
    const alerts = await monitoringSystem.getAlerts(false);

    // Get recent traces
    const traces = await observabilitySystem.getTraces({ limit: 10 });

    // Get recent logs
    const logs = await observabilitySystem.getLogs({ limit: 20 });

    // Get recent errors
    const errors = await observabilitySystem.getErrors({ limit: 10 });

    const dashboard = {
      timestamp: new Date().toISOString(),
      health: {
        system: health,
        observability: observabilityHealth,
      },
      performance: performanceReport,
      metrics: {
        errorRate: recentMetrics.errorRate.slice(-10),
        responseTime: recentMetrics.responseTime.slice(-10),
        memoryUsage: recentMetrics.memoryUsage.slice(-10),
        cpuUsage: recentMetrics.cpuUsage.slice(-10),
      },
      alerts: {
        active: alerts.filter(a => !a.resolved),
        recent: alerts.slice(0, 10),
      },
      traces: {
        recent: traces,
        count: traces.length,
      },
      logs: {
        recent: logs,
        count: logs.length,
      },
      errors: {
        recent: errors,
        count: errors.length,
      },
      summary: {
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter(a => !a.resolved).length,
        performanceScore: performanceReport.score,
        systemStatus: health.status,
        observabilityStatus: observabilityHealth.status,
      },
    };

    return new Response(JSON.stringify(dashboard), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
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
