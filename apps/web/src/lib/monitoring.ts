import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('monitoring');

import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { analytics } from './analytics';

interface MetricData {
  name: string;
  value: number;
  timestamp: string;
  tags: Record<string, string>;
  metadata?: any;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // minutes
  lastTriggered?: string;
}

interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

class MonitoringSystem {
  private supabase: any;
  private alertRules: AlertRule[] = [];
  private metrics: Map<string, MetricData[]> = new Map();
  private alerts: Alert[] = [];

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    );
    this.initializeAlertRules();
  }

  private initializeAlertRules(): void {
    this.alertRules = [
      {
        id: 'error_rate_high',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 0.05, // 5%
        severity: 'high',
        enabled: true,
        cooldown: 15,
      },
      {
        id: 'response_time_slow',
        name: 'Slow Response Time',
        metric: 'response_time_ms',
        condition: 'gt',
        threshold: 5000, // 5 seconds
        severity: 'medium',
        enabled: true,
        cooldown: 10,
      },
      {
        id: 'ai_cost_high',
        name: 'High AI Cost',
        metric: 'ai_cost_per_hour',
        condition: 'gt',
        threshold: 100, // $100/hour
        severity: 'high',
        enabled: true,
        cooldown: 30,
      },
      {
        id: 'prompt_injection_detected',
        name: 'Prompt Injection Detected',
        metric: 'prompt_injection_attempts',
        condition: 'gt',
        threshold: 0,
        severity: 'critical',
        enabled: true,
        cooldown: 5,
      },
      {
        id: 'memory_usage_high',
        name: 'High Memory Usage',
        metric: 'memory_usage_percent',
        condition: 'gt',
        threshold: 85, // 85%
        severity: 'medium',
        enabled: true,
        cooldown: 20,
      },
      {
        id: 'cpu_usage_high',
        name: 'High CPU Usage',
        metric: 'cpu_usage_percent',
        condition: 'gt',
        threshold: 90, // 90%
        severity: 'high',
        enabled: true,
        cooldown: 15,
      },
      {
        id: 'database_connections_high',
        name: 'High Database Connections',
        metric: 'database_connections',
        condition: 'gt',
        threshold: 80, // 80 connections
        severity: 'medium',
        enabled: true,
        cooldown: 25,
      },
      {
        id: 'failed_logins_high',
        name: 'High Failed Login Attempts',
        metric: 'failed_logins_per_minute',
        condition: 'gt',
        threshold: 10, // 10 per minute
        severity: 'high',
        enabled: true,
        cooldown: 10,
      },
    ];
  }

  async recordMetric(
    name: string,
    value: number,
    tags: Record<string, string> = {},
    metadata?: any
  ): Promise<void> {
    try {
      const metric: MetricData = {
        name,
        value,
        timestamp: new Date().toISOString(),
        tags,
        metadata,
      };

      // Store in memory for quick access
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(metric);

      // Keep only last 1000 metrics per name
      const metrics = this.metrics.get(name)!;
      if (metrics.length > 1000) {
        metrics.splice(0, metrics.length - 1000);
      }

      // Store in database
      await this.supabase.from('system_metrics').insert({
        metric_type: name,
        value,
        metadata: { tags, ...metadata },
        timestamp: metric.timestamp,
      });

      // Check for alerts
      await this.checkAlerts(name, value, tags);

      // Log metric
      await _logger.debug(
        `Metric recorded: ${name} = ${value}`,
        {
          metric: name,
          value,
          tags,
          metadata,
        },
        'monitoring',
        'metrics'
      );
    } catch (error) {
      _logger.error('Failed to record metric ${name}:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async recordCounter(
    name: string,
    increment: number = 1,
    tags: Record<string, string> = {}
  ): Promise<void> {
    try {
      // Get current counter value
      const { data: existing } = await this.supabase
        .from('counters')
        .select('value')
        .eq('name', name)
        .eq('tags', tags)
        .single();

      const currentValue = existing?.value || 0;
      const newValue = currentValue + increment;

      // Update counter
      await this.supabase.from('counters').upsert(
        {
          name,
          value: newValue,
          tags,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'name,tags' }
      );

      // Record as metric
      await this.recordMetric(name, newValue, tags);
    } catch (error) {
      _logger.error('Failed to record counter ${name}:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async recordTimer(
    name: string,
    duration: number,
    tags: Record<string, string> = {}
  ): Promise<void> {
    try {
      await this.recordMetric(name, duration, tags);

      // Also record as counter for frequency
      await this.recordCounter(`${name}_count`, 1, tags);

      // Record min/max/average
      const metrics = this.metrics.get(name) || [];
      const values = metrics.map(m => m.value);

      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;

        await this.recordMetric(`${name}_min`, min, tags);
        await this.recordMetric(`${name}_max`, max, tags);
        await this.recordMetric(`${name}_avg`, avg, tags);
      }
    } catch (error) {
      _logger.error('Failed to record timer ${name}:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async recordGauge(
    name: string,
    value: number,
    tags: Record<string, string> = {}
  ): Promise<void> {
    try {
      await this.recordMetric(name, value, tags);
    } catch (error) {
      _logger.error('Failed to record gauge ${name}:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async checkAlerts(
    metricName: string,
    value: number,
    tags: Record<string, string>
  ): Promise<void> {
    try {
      const relevantRules = this.alertRules.filter(
        rule =>
          rule.enabled &&
          rule.metric === metricName &&
          this.isRuleApplicable(rule, tags)
      );

      for (const rule of relevantRules) {
        const shouldTrigger = this.evaluateCondition(
          value,
          rule.condition,
          rule.threshold
        );

        if (shouldTrigger) {
          // Check cooldown
          if (this.isInCooldown(rule)) {
            continue;
          }

          // Create alert
          const alert: Alert = {
            id: `${rule.id}_${Date.now()}`,
            ruleId: rule.id,
            severity: rule.severity,
            message: `${rule.name}: ${metricName} = ${value} (threshold: ${rule.condition} ${rule.threshold})`,
            value,
            threshold: rule.threshold,
            timestamp: new Date().toISOString(),
            resolved: false,
          };

          this.alerts.push(alert);
          rule.lastTriggered = alert.timestamp;

          // Store alert in database
          await this.supabase.from('alerts').insert(alert);

          // Send notification
          await this.sendAlertNotification(alert);

          // Log alert
          await _logger.warn(
            `Alert triggered: ${rule.name}`,
            {
              ruleId: rule.id,
              metric: metricName,
              value,
              threshold: rule.threshold,
              severity: rule.severity,
            },
            'monitoring',
            'alerts'
          );
        }
      }
    } catch (error) {
      // Error handled: Failed to check alerts:
    }
  }

  private isRuleApplicable(
    rule: AlertRule,
    tags: Record<string, string>
  ): boolean {
    // This would check if the rule applies to the specific tags
    // For now, assume all rules apply to all metrics
    return true;
  }

  private evaluateCondition(
    value: number,
    condition: string,
    threshold: number
  ): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'lt':
        return value < threshold;
      case 'eq':
        return value === threshold;
      case 'gte':
        return value >= threshold;
      case 'lte':
        return value <= threshold;
      default:
        return false;
    }
  }

  private isInCooldown(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return false;

    const lastTriggered = new Date(rule.lastTriggered);
    const now = new Date();
    const diffMinutes = (now.getTime() - lastTriggered.getTime()) / (1000 * 60);

    return diffMinutes < rule.cooldown;
  }

  private async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // Send to various channels based on severity
      const channels = this.getNotificationChannels(alert.severity);

      for (const channel of channels) {
        await this.sendToChannel(channel, alert);
      }

      // Track alert event
      await analytics.trackEvent('alert_triggered', {
        rule_id: alert.ruleId,
        severity: alert.severity,
        metric_value: alert.value,
        threshold: alert.threshold,
      });
    } catch (error) {
      // Error handled: Failed to send alert notification:
    }
  }

  private getNotificationChannels(severity: string): string[] {
    switch (severity) {
      case 'critical':
        return ['email', 'slack', 'pagerduty', 'sms'];
      case 'high':
        return ['email', 'slack', 'pagerduty'];
      case 'medium':
        return ['email', 'slack'];
      case 'low':
        return ['email'];
      default:
        return ['email'];
    }
  }

  private async sendToChannel(channel: string, alert: Alert): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmailAlert(alert);
          break;
        case 'slack':
          await this.sendSlackAlert(alert);
          break;
        case 'pagerduty':
          await this.sendPagerDutyAlert(alert);
          break;
        case 'sms':
          await this.sendSMSAlert(alert);
          break;
      }
    } catch (error) {
      _logger.error('Failed to send ${channel} alert:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Implementation would send email via Resend or similar service
      }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    // Implementation would send Slack message
      }

  private async sendPagerDutyAlert(alert: Alert): Promise<void> {
    // Implementation would send PagerDuty incident
      }

  private async sendSMSAlert(alert: Alert): Promise<void> {
    // Implementation would send SMS
      }

  async getMetrics(
    name: string,
    startTime?: string,
    endTime?: string
  ): Promise<MetricData[]> {
    try {
      let query = this.supabase
        .from('system_metrics')
        .select('*')
        .eq('metric_type', name)
        .order('timestamp', { ascending: false });

      if (startTime) {
        query = query.gte('timestamp', startTime);
      }
      if (endTime) {
        query = query.lte('timestamp', endTime);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get metrics: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      _logger.error('Failed to get metrics ${name}:', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  async getAlerts(resolved: boolean = false): Promise<Alert[]> {
    try {
      const { data, error } = await this.supabase
        .from('alerts')
        .select('*')
        .eq('resolved', resolved)
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Failed to get alerts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      // Error handled: Failed to get alerts:
      return [];
    }
  }

  async resolveAlert(alertId: string): Promise<void> {
    try {
      await this.supabase
        .from('alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      // Update in-memory alerts
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
      }

      await _logger.info(
        `Alert resolved: ${alertId}`,
        {
          alertId,
        },
        'monitoring',
        'alerts'
      );
    } catch (error) {
      _logger.error('Failed to resolve alert ${alertId}:', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: Record<string, unknown>;
    alerts: Alert[];
  }> {
    try {
      const activeAlerts = await this.getAlerts(false);
      const criticalAlerts = activeAlerts.filter(
        a => a.severity === 'critical'
      );
      const highAlerts = activeAlerts.filter(a => a.severity === 'high');

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (criticalAlerts.length > 0) {
        status = 'unhealthy';
      } else if (highAlerts.length > 0) {
        status = 'degraded';
      }

      // Get key metrics
      const metrics = {
        activeAlerts: activeAlerts.length,
        criticalAlerts: criticalAlerts.length,
        highAlerts: highAlerts.length,
        uptime: await this.getUptime(),
        errorRate: await this.getErrorRate(),
        responseTime: await this.getAverageResponseTime(),
      };

      return {
        status,
        metrics,
        alerts: activeAlerts,
      };
    } catch (error) {
      // Error handled: Failed to get health status:
      return {
        status: 'unhealthy',
        metrics: {},
        alerts: [],
      };
    }
  }

  private async getUptime(): Promise<number> {
    // This would calculate actual uptime
    return 99.9;
  }

  private async getErrorRate(): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('system_metrics')
        .select('value')
        .eq('metric_type', 'error_rate')
        .order('timestamp', { ascending: false })
        .limit(1);

      return data?.[0]?.value || 0;
    } catch (error) {
      return 0;
    }
  }

  private async getAverageResponseTime(): Promise<number> {
    try {
      const { data } = await this.supabase
        .from('system_metrics')
        .select('value')
        .eq('metric_type', 'response_time_ms')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (!data || data.length === 0) return 0;

      const sum = data.reduce((acc, item) => acc + item.value, 0);
      return sum / data.length;
    } catch (error) {
      return 0;
    }
  }

  async generateReport(
    startTime: string,
    endTime: string
  ): Promise<{
    summary: any;
    metrics: Record<string, MetricData[]>;
    alerts: Alert[];
    recommendations: string[];
  }> {
    try {
      const metrics: Record<string, MetricData[]> = {};
      const metricNames = [
        'error_rate',
        'response_time_ms',
        'ai_cost_per_hour',
        'memory_usage_percent',
      ];

      for (const name of metricNames) {
        metrics[name] = await this.getMetrics(name, startTime, endTime);
      }

      const alerts = await this.getAlerts();
      const filteredAlerts = alerts.filter(
        a =>
          new Date(a.timestamp) >= new Date(startTime) &&
          new Date(a.timestamp) <= new Date(endTime)
      );

      const summary = {
        period: { startTime, endTime },
        totalAlerts: filteredAlerts.length,
        criticalAlerts: filteredAlerts.filter(a => a.severity === 'critical')
          .length,
        averageErrorRate: this.calculateAverage(metrics.error_rate),
        averageResponseTime: this.calculateAverage(metrics.response_time_ms),
        totalAICost: this.calculateTotal(metrics.ai_cost_per_hour),
      };

      const recommendations = this.generateRecommendations(
        summary,
        filteredAlerts
      );

      return {
        summary,
        metrics,
        alerts: filteredAlerts,
        recommendations,
      };
    } catch (error) {
      // Error handled: Failed to generate report:
      return {
        summary: {},
        metrics: {},
        alerts: [],
        recommendations: [],
      };
    }
  }

  private calculateAverage(metrics: MetricData[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  private calculateTotal(metrics: MetricData[]): number {
    return metrics.reduce((acc, m) => acc + m.value, 0);
  }

  private generateRecommendations(summary: any, alerts: Alert[]): string[] {
    const recommendations: string[] = [];

    if (summary.criticalAlerts > 0) {
      recommendations.push('Address critical alerts immediately');
    }

    if (summary.averageErrorRate > 0.05) {
      recommendations.push('Error rate is high - investigate and fix issues');
    }

    if (summary.averageResponseTime > 5000) {
      recommendations.push('Response time is slow - optimize performance');
    }

    if (summary.totalAICost > 1000) {
      recommendations.push('AI costs are high - consider optimization');
    }

    if (recommendations.length === 0) {
      recommendations.push('System is performing well - continue monitoring');
    }

    return recommendations;
  }
}

export const monitoringSystem = new MonitoringSystem();

// Utility functions for common metrics
export async function recordAPIMetric(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number
): Promise<void> {
  await monitoringSystem.recordTimer('api_response_time', duration, {
    endpoint,
    method,
    status_code: statusCode.toString(),
  });

  await monitoringSystem.recordCounter('api_requests', 1, {
    endpoint,
    method,
    status_code: statusCode.toString(),
  });

  if (statusCode >= 400) {
    await monitoringSystem.recordCounter('api_errors', 1, {
      endpoint,
      method,
      status_code: statusCode.toString(),
    });
  }
}

export async function recordAIMetric(
  model: string,
  tokens: number,
  cost: number,
  duration: number
): Promise<void> {
  await monitoringSystem.recordTimer('ai_response_time', duration, { model });
  await monitoringSystem.recordCounter('ai_requests', 1, { model });
  await monitoringSystem.recordGauge('ai_tokens_used', tokens, { model });
  await monitoringSystem.recordGauge('ai_cost', cost, { model });
}

export async function recordSecurityMetric(
  event: string,
  severity: string,
  details: any
): Promise<void> {
  await monitoringSystem.recordCounter('security_events', 1, {
    event,
    severity,
  });

  if (severity === 'critical') {
    await monitoringSystem.recordCounter('critical_security_events', 1, {
      event,
    });
  }
}
