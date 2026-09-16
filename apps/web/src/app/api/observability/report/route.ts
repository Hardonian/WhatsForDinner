import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const format = searchParams.get('format') || 'json';

    // Default to last 24 hours if no time range specified
    const end = endTime ? new Date(endTime) : new Date();
    const start = startTime
      ? new Date(startTime)
      : new Date(end.getTime() - 24 * 60 * 60 * 1000);

    // Generate monitoring report
    const monitoringReport = await monitoringSystem.generateReport(
      start.toISOString(),
      end.toISOString()
    );

    // Generate performance report
    const performanceReport =
      await performanceOptimizer.generatePerformanceReport();

    // Get system health
    const health = await monitoringSystem.getHealthStatus();

    // Get observability health
    const observabilityHealth = await observabilitySystem.getSystemHealth();

    // Get traces for the period
    const traces = await observabilitySystem.getTraces({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });

    // Get logs for the period
    const logs = await observabilitySystem.getLogs({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });

    // Get errors for the period
    const errors = await observabilitySystem.getErrors({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    });

    const report = {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
        duration: end.getTime() - start.getTime(),
      },
      monitoring: monitoringReport,
      performance: performanceReport,
      health: {
        system: health,
        observability: observabilityHealth,
      },
      traces: {
        count: traces.length,
        data: traces,
      },
      logs: {
        count: logs.length,
        data: logs,
      },
      errors: {
        count: errors.length,
        data: errors,
      },
      summary: {
        overallStatus: health.status,
        performanceScore: performanceReport.score,
        totalAlerts: monitoringReport.alerts.length,
        criticalAlerts: monitoringReport.alerts.filter(
          a => a.severity === 'critical'
        ).length,
        errorRate: monitoringReport.summary.averageErrorRate,
        responseTime: monitoringReport.summary.averageResponseTime,
        totalTraces: traces.length,
        totalLogs: logs.length,
        totalErrors: errors.length,
      },
      recommendations: [
        ...monitoringReport.recommendations,
        ...performanceReport.recommendations.map(r => ({
          type: 'performance',
          priority: r.priority,
          title: r.title,
          description: r.description,
          impact: r.impact,
          effort: r.effort,
          implementation: r.implementation,
          expectedImprovement: r.expectedImprovement,
        })),
      ],
    };

    if (format === 'markdown') {
      const markdownReport = generateMarkdownReport(report);
      return new Response(markdownReport, {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return new Response(JSON.stringify(report), {
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

function generateMarkdownReport(report: any): string {
  let markdown = `# Observability Report\n\n`;

  markdown += `**Period:** ${new Date(report.period.start).toLocaleString()} - ${new Date(report.period.end).toLocaleString()}\n`;
  markdown += `**Duration:** ${Math.round(report.period.duration / 1000 / 60)} minutes\n\n`;

  markdown += `## Summary\n\n`;
  markdown += `- **Overall Status:** ${report.summary.overallStatus.toUpperCase()}\n`;
  markdown += `- **Performance Score:** ${report.summary.performanceScore}/100\n`;
  markdown += `- **Total Alerts:** ${report.summary.totalAlerts}\n`;
  markdown += `- **Critical Alerts:** ${report.summary.criticalAlerts}\n`;
  markdown += `- **Error Rate:** ${(report.summary.errorRate * 100).toFixed(2)}%\n`;
  markdown += `- **Response Time:** ${report.summary.responseTime.toFixed(2)}ms\n`;
  markdown += `- **Total Traces:** ${report.summary.totalTraces}\n`;
  markdown += `- **Total Logs:** ${report.summary.totalLogs}\n`;
  markdown += `- **Total Errors:** ${report.summary.totalErrors}\n\n`;

  markdown += `## Health Status\n\n`;
  markdown += `### System Health\n`;
  markdown += `- **Status:** ${report.health.system.status}\n`;
  markdown += `- **Active Alerts:** ${report.health.system.alerts.length}\n\n`;

  markdown += `### Observability Health\n`;
  markdown += `- **Status:** ${report.health.observability.status}\n`;
  markdown += `- **Components:** ${Object.keys(report.health.observability.components).length}\n\n`;

  markdown += `## Performance\n\n`;
  markdown += `- **Score:** ${report.performance.score}/100\n`;
  markdown += `- **Grade:** ${report.performance.summary.grade}\n`;
  markdown += `- **Issues:** ${report.performance.summary.issues.length}\n\n`;

  if (report.performance.summary.issues.length > 0) {
    markdown += `### Performance Issues\n`;
    report.performance.summary.issues.forEach((issue: string) => {
      markdown += `- ${issue}\n`;
    });
    markdown += `\n`;
  }

  markdown += `## Alerts\n\n`;
  if (report.monitoring.alerts.length === 0) {
    markdown += `No alerts in this period.\n\n`;
  } else {
    report.monitoring.alerts.forEach((alert: any) => {
      const statusIcon = alert.resolved ? '✅' : '❌';
      markdown += `### ${statusIcon} ${alert.message}\n`;
      markdown += `- **Severity:** ${alert.severity}\n`;
      markdown += `- **Value:** ${alert.value}\n`;
      markdown += `- **Threshold:** ${alert.threshold}\n`;
      markdown += `- **Timestamp:** ${new Date(alert.timestamp).toLocaleString()}\n\n`;
    });
  }

  markdown += `## Recommendations\n\n`;
  if (report.recommendations.length === 0) {
    markdown += `No recommendations available.\n\n`;
  } else {
    report.recommendations.forEach((rec: any, index: number) => {
      markdown += `### ${index + 1}. ${rec.title}\n`;
      markdown += `- **Priority:** ${rec.priority}\n`;
      markdown += `- **Type:** ${rec.type}\n`;
      markdown += `- **Description:** ${rec.description}\n`;
      markdown += `- **Impact:** ${rec.impact}\n`;
      markdown += `- **Effort:** ${rec.effort}\n`;
      markdown += `- **Implementation:** ${rec.implementation}\n`;
      markdown += `- **Expected Improvement:** ${rec.expectedImprovement}\n\n`;
    });
  }

  markdown += `---\n`;
  markdown += `*Report generated at ${new Date().toLocaleString()}*\n`;

  return markdown;
}

export const dynamic = "force-dynamic";
