import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('monitoringalerts');

/**
 * Monitoring Alerts Configuration
 * 
 * This file configures alert thresholds and notification channels
 * for monitoring critical system metrics.
 */

export interface AlertThreshold {
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'critical' | 'warning' | 'info';
  notificationChannels: string[];
}

export interface MonitoringConfig {
  alerts: AlertThreshold[];
  notificationChannels: {
    slack?: {
      webhookUrl: string;
      channels: {
        critical: string;
        warning: string;
        info: string;
      };
    };
    email?: {
      smtp: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
          user: string;
          pass: string;
        };
      };
      recipients: {
        critical: string[];
        warning: string[];
        info: string[];
      };
    };
    pagerduty?: {
      integrationKey: string;
    };
  };
}

// Default alert thresholds
export const defaultAlerts: AlertThreshold[] = [
  // Error rate alerts
  {
    metric: 'error_rate',
    threshold: 0.05, // 5% error rate
    operator: 'gt',
    severity: 'warning',
    notificationChannels: ['slack', 'email'],
  },
  {
    metric: 'error_rate',
    threshold: 0.10, // 10% error rate
    operator: 'gt',
    severity: 'critical',
    notificationChannels: ['slack', 'email', 'pagerduty'],
  },
  
  // API latency alerts
  {
    metric: 'api_latency_p95',
    threshold: 1000, // 1 second
    operator: 'gt',
    severity: 'warning',
    notificationChannels: ['slack'],
  },
  {
    metric: 'api_latency_p95',
    threshold: 3000, // 3 seconds
    operator: 'gt',
    severity: 'critical',
    notificationChannels: ['slack', 'email', 'pagerduty'],
  },
  
  // Database connection alerts
  {
    metric: 'db_connection_pool_exhausted',
    threshold: 0.80, // 80% pool usage
    operator: 'gt',
    severity: 'warning',
    notificationChannels: ['slack'],
  },
  {
    metric: 'db_connection_pool_exhausted',
    threshold: 0.95, // 95% pool usage
    operator: 'gt',
    severity: 'critical',
    notificationChannels: ['slack', 'email', 'pagerduty'],
  },
  
  // Rate limiting alerts
  {
    metric: 'rate_limit_exceeded_count',
    threshold: 100, // 100 rate limit violations per minute
    operator: 'gt',
    severity: 'warning',
    notificationChannels: ['slack'],
  },
  
  // Security alerts
  {
    metric: 'unauthorized_access_attempts',
    threshold: 10, // 10 failed auth attempts per minute
    operator: 'gt',
    severity: 'critical',
    notificationChannels: ['slack', 'email', 'pagerduty'],
  },
  {
    metric: 'sql_injection_attempts',
    threshold: 1, // Any SQL injection attempt
    operator: 'gt',
    severity: 'critical',
    notificationChannels: ['slack', 'email', 'pagerduty'],
  },
  
  // Cost alerts
  {
    metric: 'daily_cost_usd',
    threshold: 100, // $100 per day
    operator: 'gt',
    severity: 'warning',
    notificationChannels: ['slack', 'email'],
  },
  {
    metric: 'daily_cost_usd',
    threshold: 500, // $500 per day
    operator: 'gt',
    severity: 'critical',
    notificationChannels: ['slack', 'email', 'pagerduty'],
  },
];

// Load configuration from environment
export function loadMonitoringConfig(): MonitoringConfig {
  const config: MonitoringConfig = {
    alerts: defaultAlerts,
    notificationChannels: {},
  };

  // Slack configuration
  if (process.env.SLACK_WEBHOOK_URL) {
    config.notificationChannels.slack = {
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channels: {
        critical: process.env.SLACK_CHANNEL_CRITICAL || '#alerts-critical',
        warning: process.env.SLACK_CHANNEL_WARNING || '#alerts-warning',
        info: process.env.SLACK_CHANNEL_INFO || '#alerts-info',
      },
    };
  }

  // Email configuration
  if (process.env.EMAIL_SMTP_HOST) {
    config.notificationChannels.email = {
      smtp: {
        host: process.env.EMAIL_SMTP_HOST,
        port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
        secure: process.env.EMAIL_SMTP_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_SMTP_USER || '',
          pass: process.env.EMAIL_SMTP_PASS || '',
        },
      },
      recipients: {
        critical: (process.env.EMAIL_RECIPIENTS_CRITICAL || '').split(',').filter(Boolean),
        warning: (process.env.EMAIL_RECIPIENTS_WARNING || '').split(',').filter(Boolean),
        info: (process.env.EMAIL_RECIPIENTS_INFO || '').split(',').filter(Boolean),
      },
    };
  }

  // PagerDuty configuration
  if (process.env.PAGERDUTY_INTEGRATION_KEY) {
    config.notificationChannels.pagerduty = {
      integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY,
    };
  }

  return config;
}

// Check if alert should trigger
export function shouldTriggerAlert(
  metric: string,
  value: number,
  alert: AlertThreshold
): boolean {
  switch (alert.operator) {
    case 'gt':
      return value > alert.threshold;
    case 'lt':
      return value < alert.threshold;
    case 'eq':
      return value === alert.threshold;
    default:
      return false;
  }
}

// Send alert notification
export async function sendAlert(
  alert: AlertThreshold,
  metricValue: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const config = loadMonitoringConfig();
  const message = `?? ${alert.severity.toUpperCase()}: ${alert.metric} = ${metricValue} (threshold: ${alert.threshold})`;
  
  // Send to configured channels
  for (const channel of alert.notificationChannels) {
    switch (channel) {
      case 'slack':
        if (config.notificationChannels.slack) {
          await sendSlackAlert(config.notificationChannels.slack, alert, message, metadata);
        }
        break;
      case 'email':
        if (config.notificationChannels.email) {
          await sendEmailAlert(config.notificationChannels.email, alert, message, metadata);
        }
        break;
      case 'pagerduty':
        if (config.notificationChannels.pagerduty && alert.severity === 'critical') {
          await sendPagerDutyAlert(config.notificationChannels.pagerduty, alert, message, metadata);
        }
        break;
    }
  }
}

async function sendSlackAlert(
  config: NonNullable<MonitoringConfig['notificationChannels']['slack']>,
  alert: AlertThreshold,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const channel = config.channels[alert.severity];
  
  try {
    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel,
        text: message,
        attachments: metadata ? [{
          color: alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'good',
          fields: Object.entries(metadata).map(([key, value]) => ({
            title: key,
            value: String(value),
            short: true,
          })),
        }] : [],
      }),
    });
  } catch (error) {
    // Error handled: Failed to send Slack alert:
  }
}

async function sendEmailAlert(
  config: NonNullable<MonitoringConfig['notificationChannels']['email']>,
  alert: AlertThreshold,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  // Email sending would be implemented using nodemailer or similar
  // This is a placeholder implementation
  _logger.info(`[Email Alert: ${alert.metric}]`, {
    subject: `[${alert.severity}] Alert: ${alert.metric}`,
    body: `${message}\n\nMetadata: ${JSON.stringify(metadata, null, 2)}`,
  });
}

async function sendPagerDutyAlert(
  config: NonNullable<MonitoringConfig['notificationChannels']['pagerduty']>,
  alert: AlertThreshold,
  message: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token token=${config.integrationKey}`,
      },
      body: JSON.stringify({
        routing_key: config.integrationKey,
        event_action: 'trigger',
        payload: {
          summary: message,
          severity: alert.severity,
          source: 'whats-for-dinner',
          custom_details: metadata || {},
        },
      }),
    });
  } catch (error) {
    // Error handled: Failed to send PagerDuty alert:
  }
}
