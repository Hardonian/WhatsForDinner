import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('alertingsystem');

/**
 * Alerting System
 * 
 * Configures alerts for error rate thresholds and performance degradation
 */

import { analytics } from './analytics';
import { logger } from './logger';

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // minutes
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

class AlertingSystem {
  private rules: AlertRule[] = [];
  private alerts: Alert[] = [];
  private alertChannels: {
    email?: string[];
    slack?: string;
    webhook?: string;
  } = {};

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'error_rate_high',
        name: 'High Error Rate',
        metric: 'error_rate',
        condition: 'gt',
        threshold: 0.01, // 1%
        severity: 'high',
        enabled: true,
        cooldown: 15,
      },
      {
        id: 'suggestion_time_slow',
        name: 'Slow Suggestion Generation',
        metric: 'suggestion_generation_time_p95',
        condition: 'gt',
        threshold: 30000, // 30 seconds
        severity: 'medium',
        enabled: true,
        cooldown: 10,
      },
      {
        id: 'api_response_slow',
        name: 'Slow API Response',
        metric: 'api_response_time_p95',
        condition: 'gt',
        threshold: 500, // 500ms
        severity: 'medium',
        enabled: true,
        cooldown: 10,
      },
      {
        id: 'activation_rate_low',
        name: 'Low Activation Rate',
        metric: 'activation_rate',
        condition: 'lt',
        threshold: 0.5, // 50%
        severity: 'high',
        enabled: true,
        cooldown: 60,
      },
    ];
  }

  /**
   * Check if alert should fire based on rule and value
   */
  private shouldTrigger(rule: AlertRule, value: number): boolean {
    if (!rule.enabled) {
      return false;
    }

    // Check cooldown
    if (rule.lastTriggered) {
      const cooldownMs = rule.cooldown * 60 * 1000;
      const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
      if (timeSinceLastTrigger < cooldownMs) {
        return false;
      }
    }

    // Check condition
    switch (rule.condition) {
      case 'gt':
        return value > rule.threshold;
      case 'gte':
        return value >= rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'lte':
        return value <= rule.threshold;
      case 'eq':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  /**
   * Evaluate metric against all rules
   */
  async evaluateMetric(metricName: string, value: number): Promise<void> {
    const relevantRules = this.rules.filter(r => r.metric === metricName);

    for (const rule of relevantRules) {
      if (this.shouldTrigger(rule, value)) {
        await this.triggerAlert(rule, value);
      }
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, value: number): Promise<void> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      severity: rule.severity,
      message: `${rule.name}: ${value} ${rule.condition === 'gt' ? 'exceeds' : 'is below'} threshold of ${rule.threshold}`,
      value,
      threshold: rule.threshold,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(alert);
    rule.lastTriggered = new Date();

    // Log alert
    await _logger.error(
      `Alert triggered: ${rule.name}`,
      {
        ruleId: rule.id,
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        severity: rule.severity,
      },
      'alerting',
      'system'
    );

    // Track alert event
    await analytics.trackEvent('alert_triggered', {
      alert_id: alert.id,
      rule_id: rule.id,
      severity: rule.severity,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
    });

    // Send notifications (implement based on channels)
    await this.sendNotifications(alert);
  }

  /**
   * Send notifications via configured channels
   */
  private async sendNotifications(alert: Alert): Promise<void> {
    // Email notifications
    if (this.alertChannels.email && this.alertChannels.email.length > 0) {
      // Implement email sending
      _logger.info(`Sending email alert to ${this.alertChannels.email.join(', ')}`);
    }

    // Slack notifications
    if (this.alertChannels.slack) {
      // Implement Slack webhook
      _logger.info(`Sending Slack alert to ${this.alertChannels.slack}`);
    }

    // Webhook notifications
    if (this.alertChannels.webhook) {
      try {
        await fetch(this.alertChannels.webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert),
        });
      } catch (error) {
        _logger.error('Failed to send webhook alert:', { error: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Configure alert channels
   */
  configureChannels(channels: {
    email?: string[];
    slack?: string;
    webhook?: string;
  }): void {
    this.alertChannels = { ...this.alertChannels, ...channels };
  }

  /**
   * Add custom alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.push(rule);
  }
}

// Singleton instance
export const alertingSystem = new AlertingSystem();

// Configure channels from environment variables
if (typeof process !== 'undefined') {
  const emailRecipients = process.env.ALERT_EMAIL_RECIPIENTS?.split(',');
  const slackWebhook = process.env.SLACK_ALERT_WEBHOOK;
  const alertWebhook = process.env.ALERT_WEBHOOK_URL;

  if (emailRecipients || slackWebhook || alertWebhook) {
    alertingSystem.configureChannels({
      email: emailRecipients,
      slack: slackWebhook,
      webhook: alertWebhook,
    });
  }
}
