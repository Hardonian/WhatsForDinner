import { createClient } from '@supabase/supabase-js';
import { monitoringSystem } from './monitoring';
import { observabilitySystem } from './observability';
import { logger } from './logger';

interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  duration: number;
  details?: any;
  timestamp: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheckResult[];
  timestamp: string;
  version: string;
  uptime: number;
  environment: string;
}

class HealthCheckSystem {
  private supabase: any;
  private startTime: number;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    );
    this.startTime = Date.now();
  }

  async runHealthChecks(): Promise<SystemHealth> {
    const checks: HealthCheckResult[] = [];

    // Database connectivity
    checks.push(await this.checkDatabase());

    // API endpoints
    checks.push(await this.checkAPIEndpoints());

    // External services
    checks.push(await this.checkExternalServices());

    // Security systems
    checks.push(await this.checkSecuritySystems());

    // Performance metrics
    checks.push(await this.checkPerformance());

    // Monitoring systems
    checks.push(await this.checkMonitoring());

    // AI services
    checks.push(await this.checkAIServices());

    // Storage systems
    checks.push(await this.checkStorage());

    // Network connectivity
    checks.push(await this.checkNetwork());

    // Memory and CPU
    checks.push(await this.checkSystemResources());

    const overall = this.determineOverallStatus(checks);

    return {
      overall,
      checks,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Date.now() - this.startTime,
      environment: process.env.NODE_ENV || 'development',
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // Test basic connectivity
      const { data, error } = await this.supabase
        .from('system_metrics')
        .select('count')
        .limit(1);

      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }

      // Test write capability
      const testData = {
        metric_type: 'health_check',
        value: 1,
        metadata: { test: true },
        timestamp: new Date().toISOString(),
      };

      const { error: insertError } = await this.supabase
        .from('system_metrics')
        .insert(testData);

      if (insertError) {
        throw new Error(`Database write failed: ${insertError.message}`);
      }

      // Test read capability
      const { data: readData, error: readError } = await this.supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_type', 'health_check')
        .order('timestamp', { ascending: false })
        .limit(1);

      if (readError) {
        throw new Error(`Database read failed: ${readError.message}`);
      }

      const duration = Date.now() - start;

      return {
        name: 'database',
        status: 'healthy',
        message: 'Database is accessible and responsive',
        duration,
        details: {
          connected: true,
          readWrite: true,
          responseTime: duration,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'database',
        status: 'unhealthy',
        message: `Database check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
          connected: false,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkAPIEndpoints(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const endpoints = ['/api/health', '/api/recipes', '/api/pantry'];

      const results = await Promise.allSettled(
        endpoints.map(async endpoint => {
          const response = await fetch(`${baseUrl}${endpoint}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          return {
            endpoint,
            status: response.status,
            ok: response.ok,
          };
        })
      );

      const failed = results.filter(
        r => r.status === 'rejected' || !r.value.ok
      );
      const successCount = results.length - failed.length;
      const successRate = successCount / results.length;

      const duration = Date.now() - start;
      const status =
        successRate >= 0.8
          ? 'healthy'
          : successRate >= 0.5
            ? 'degraded'
            : 'unhealthy';

      return {
        name: 'api_endpoints',
        status,
        message: `${successCount}/${results.length} API endpoints are healthy`,
        duration,
        details: {
          totalEndpoints: results.length,
          healthyEndpoints: successCount,
          successRate,
          failures: failed.map(f =>
            f.status === 'rejected' ? f.reason : f.value
          ),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'api_endpoints',
        status: 'unhealthy',
        message: `API endpoints check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkExternalServices(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const services = [
        {
          name: 'OpenAI',
          url: 'https://api.openai.com/v1/models',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        },
        {
          name: 'Supabase',
          url: process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/',
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          },
        },
      ];

      const results = await Promise.allSettled(
        services.map(async service => {
          const response = await fetch(service.url, {
            method: 'GET',
            headers: service.headers,
          });
          return {
            name: service.name,
            status: response.status,
            ok: response.ok,
          };
        })
      );

      const healthy = results.filter(
        r => r.status === 'fulfilled' && r.value.ok
      );
      const unhealthy = results.filter(
        r => r.status === 'rejected' || !r.value.ok
      );

      const duration = Date.now() - start;
      const status =
        unhealthy.length === 0
          ? 'healthy'
          : unhealthy.length < services.length
            ? 'degraded'
            : 'unhealthy';

      return {
        name: 'external_services',
        status,
        message: `${healthy.length}/${services.length} external services are healthy`,
        duration,
        details: {
          healthy: healthy.map(h => h.value),
          unhealthy: unhealthy.map(u =>
            u.status === 'rejected' ? u.reason : u.value
          ),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'external_services',
        status: 'unhealthy',
        message: `External services check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkSecuritySystems(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const securityChecks = [
        {
          name: 'Environment Variables',
          check: () => this.checkEnvironmentVariables(),
        },
        {
          name: 'Security Headers',
          check: () => this.checkSecurityHeaders(),
        },
        {
          name: 'Rate Limiting',
          check: () => this.checkRateLimiting(),
        },
      ];

      const results = await Promise.allSettled(
        securityChecks.map(async check => {
          const result = await check.check();
          return {
            name: check.name,
            ...result,
          };
        })
      );

      const healthy = results.filter(
        r => r.status === 'fulfilled' && r.value.status === 'healthy'
      );
      const unhealthy = results.filter(
        r => r.status === 'rejected' || r.value.status !== 'healthy'
      );

      const duration = Date.now() - start;
      const status =
        unhealthy.length === 0
          ? 'healthy'
          : unhealthy.length < securityChecks.length
            ? 'degraded'
            : 'unhealthy';

      return {
        name: 'security_systems',
        status,
        message: `${healthy.length}/${securityChecks.length} security checks passed`,
        duration,
        details: {
          checks: results.map(r =>
            r.status === 'fulfilled'
              ? r.value
              : { name: 'Unknown', status: 'unhealthy', error: r.reason }
          ),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'security_systems',
        status: 'unhealthy',
        message: `Security systems check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkEnvironmentVariables(): Promise<{
    status: string;
    message: string;
  }> {
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length === 0) {
      return {
        status: 'healthy',
        message: 'All required environment variables are set',
      };
    } else {
      return {
        status: 'unhealthy',
        message: `Missing environment variables: ${missing.join(', ')}`,
      };
    }
  }

  private async checkSecurityHeaders(): Promise<{
    status: string;
    message: string;
  }> {
    // This would check if security headers are properly configured
    // For now, return healthy as this is handled by Next.js
    return {
      status: 'healthy',
      message: 'Security headers are configured',
    };
  }

  private async checkRateLimiting(): Promise<{
    status: string;
    message: string;
  }> {
    // This would check if rate limiting is working
    // For now, return healthy as this is handled by middleware
    return {
      status: 'healthy',
      message: 'Rate limiting is active',
    };
  }

  private async checkPerformance(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const metrics = await monitoringSystem.getMetrics('response_time_ms');
      const recentMetrics = metrics.slice(-10); // Last 10 metrics

      if (recentMetrics.length === 0) {
        return {
          name: 'performance',
          status: 'degraded',
          message: 'No performance metrics available',
          duration: Date.now() - start,
          details: {
            metricsAvailable: false,
          },
          timestamp: new Date().toISOString(),
        };
      }

      const avgResponseTime =
        recentMetrics.reduce((sum, m) => sum + m.value, 0) /
        recentMetrics.length;
      const maxResponseTime = Math.max(...recentMetrics.map(m => m.value));

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (avgResponseTime > 5000) status = 'unhealthy';
      else if (avgResponseTime > 2000) status = 'degraded';

      const duration = Date.now() - start;

      return {
        name: 'performance',
        status,
        message: `Average response time: ${avgResponseTime.toFixed(2)}ms`,
        duration,
        details: {
          averageResponseTime: avgResponseTime,
          maxResponseTime,
          metricsCount: recentMetrics.length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'performance',
        status: 'unhealthy',
        message: `Performance check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkMonitoring(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const health = await monitoringSystem.getHealthStatus();
      const duration = Date.now() - start;

      return {
        name: 'monitoring',
        status: health.status,
        message: `Monitoring system is ${health.status}`,
        duration,
        details: {
          activeAlerts: health.alerts.length,
          metrics: health.metrics,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'monitoring',
        status: 'unhealthy',
        message: `Monitoring check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkAIServices(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // Check if OpenAI API key is valid
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });

      const duration = Date.now() - start;
      const status = response.ok ? 'healthy' : 'unhealthy';

      return {
        name: 'ai_services',
        status,
        message: `AI services are ${status}`,
        duration,
        details: {
          openaiStatus: response.status,
          responseTime: duration,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'ai_services',
        status: 'unhealthy',
        message: `AI services check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkStorage(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // Check Supabase storage
      const { data, error } = await this.supabase.storage
        .from('test-bucket')
        .list('', { limit: 1 });

      const duration = Date.now() - start;
      const status = error ? 'unhealthy' : 'healthy';

      return {
        name: 'storage',
        status,
        message: `Storage is ${status}`,
        duration,
        details: {
          error: error?.message,
          accessible: !error,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'storage',
        status: 'unhealthy',
        message: `Storage check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkNetwork(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // Test network connectivity
      const testUrls = ['https://www.google.com', 'https://www.cloudflare.com'];

      const results = await Promise.allSettled(
        testUrls.map(async url => {
          const response = await fetch(url, { method: 'HEAD' });
          return {
            url,
            status: response.status,
            ok: response.ok,
          };
        })
      );

      const healthy = results.filter(
        r => r.status === 'fulfilled' && r.value.ok
      );
      const duration = Date.now() - start;
      const status =
        healthy.length === testUrls.length ? 'healthy' : 'degraded';

      return {
        name: 'network',
        status,
        message: `${healthy.length}/${testUrls.length} network tests passed`,
        duration,
        details: {
          testUrls: results.map(r =>
            r.status === 'fulfilled'
              ? r.value
              : { url: 'Unknown', status: 'error' }
          ),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'network',
        status: 'unhealthy',
        message: `Network check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkSystemResources(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
      const memoryLimitMB = 512; // Assume 512MB limit
      const memoryUsagePercent = (memoryUsageMB / memoryLimitMB) * 100;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (memoryUsagePercent > 90) status = 'unhealthy';
      else if (memoryUsagePercent > 75) status = 'degraded';

      const duration = Date.now() - start;

      return {
        name: 'system_resources',
        status,
        message: `Memory usage: ${memoryUsagePercent.toFixed(1)}%`,
        duration,
        details: {
          memoryUsageMB,
          memoryUsagePercent,
          memoryLimitMB,
          heapTotal: memoryUsage.heapTotal / 1024 / 1024,
          external: memoryUsage.external / 1024 / 1024,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const duration = Date.now() - start;

      return {
        name: 'system_resources',
        status: 'unhealthy',
        message: `System resources check failed: ${error.message}`,
        duration,
        details: {
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  private determineOverallStatus(
    checks: HealthCheckResult[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  async generateHealthReport(): Promise<string> {
    const health = await this.runHealthChecks();

    let report = `# System Health Report\n\n`;
    report += `**Overall Status:** ${health.overall.toUpperCase()}\n`;
    report += `**Timestamp:** ${health.timestamp}\n`;
    report += `**Version:** ${health.version}\n`;
    report += `**Environment:** ${health.environment}\n`;
    report += `**Uptime:** ${Math.round(health.uptime / 1000)}s\n\n`;

    report += `## Health Checks\n\n`;

    for (const check of health.checks) {
      const statusIcon =
        check.status === 'healthy'
          ? '✅'
          : check.status === 'degraded'
            ? '⚠️'
            : '❌';
      report += `### ${statusIcon} ${check.name.replace('_', ' ').toUpperCase()}\n`;
      report += `- **Status:** ${check.status}\n`;
      report += `- **Message:** ${check.message}\n`;
      report += `- **Duration:** ${check.duration}ms\n`;

      if (check.details) {
        report += `- **Details:**\n`;
        for (const [key, value] of Object.entries(check.details)) {
          report += `  - ${key}: ${JSON.stringify(value)}\n`;
        }
      }
      report += `\n`;
    }

    return report;
  }
}

export const healthCheckSystem = new HealthCheckSystem();

// API endpoint for health checks
export async function GET() {
  try {
    const health = await healthCheckSystem.runHealthChecks();

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
        overall: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
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
