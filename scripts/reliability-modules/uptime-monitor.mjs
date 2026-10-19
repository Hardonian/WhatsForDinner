#!/usr/bin/env node

/**
 * Uptime monitor for the deployed readiness endpoint.
 *
 * A successful TCP request is not enough: a check is healthy only when the
 * endpoint returns 2xx JSON with an explicit healthy status.
 */

import https from 'https';
import http from 'http';

const HEALTHY_RESPONSE_STATUSES = new Set(['healthy', 'ready', 'ok']);
const INVALID_URL_MARKERS = ['${{', '}}', 'undefined', 'null', 'placeholder'];

function normalizeBaseUrl(value) {
  const trimmed = value.trim();
  return /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function validateHealthCheckUrl(value) {
  if (!value || typeof value !== 'string') {
    throw new Error('A health-check URL or deployment domain must be configured');
  }

  const candidate = value.trim();
  if (!candidate || INVALID_URL_MARKERS.some((marker) => candidate.toLowerCase().includes(marker.toLowerCase()))) {
    throw new Error('Health-check URL contains an unresolved or placeholder value');
  }

  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`Health-check URL is invalid: ${candidate}`);
  }

  const isLocalHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !isLocalHttp) {
    throw new Error('Health-check URL must use HTTPS (HTTP is allowed only for localhost)');
  }
  if (url.username || url.password) {
    throw new Error('Health-check URL must not contain credentials');
  }
  if (url.hash) {
    throw new Error('Health-check URL must not contain a fragment');
  }

  return url;
}

export function resolveHealthCheckUrl(env = process.env) {
  if (env.HEALTH_CHECK_URL?.trim()) {
    return validateHealthCheckUrl(env.HEALTH_CHECK_URL).toString();
  }

  const base = env.NEXT_PUBLIC_SITE_URL?.trim() || env.VERCEL_PROJECT_DOMAIN?.trim();
  if (!base) {
    throw new Error('Set HEALTH_CHECK_URL, NEXT_PUBLIC_SITE_URL, or VERCEL_PROJECT_DOMAIN');
  }

  const baseUrl = validateHealthCheckUrl(normalizeBaseUrl(base));
  return new URL('/api/health/ready', baseUrl).toString();
}

export class UptimeMonitor {
  constructor(supabase, config) {
    this.supabase = supabase;
    this.config = config;
    this.results = {
      timestamp: new Date().toISOString(),
      uptime: 0,
      avgLatency: 0,
      downtime: 0,
      checks: [],
      alerts: []
    };
  }

  async run() {
    const healthUrl = resolveHealthCheckUrl();
    const checkResult = await this.performHealthCheck(healthUrl);

    await this.storeHealthCheck(checkResult);
    await this.calculateUptime();
    await this.checkDowntimeAlerts();

    if (!checkResult.healthy) {
      const detail = checkResult.error || `HTTP ${checkResult.status}, application status ${checkResult.applicationStatus || 'missing'}`;
      throw new Error(`Readiness check failed for ${checkResult.url}: ${detail}`);
    }

    return this.results;
  }

  async performHealthCheck(value) {
    const url = validateHealthCheckUrl(value);
    const startTime = Date.now();

    return new Promise((resolve) => {
      const client = url.protocol === 'https:' ? https : http;
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        resolve({
          timestamp: new Date().toISOString(),
          url: url.toString(),
          latency: Date.now() - startTime,
          ...result
        });
      };

      const req = client.get(url, {
        timeout: 10000,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'WhatsForDinner-Reliability-Monitor/1.0'
        }
      }, (res) => {
        const status = res.statusCode || 0;
        let data = '';

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
          if (data.length > 64 * 1024) {
            req.destroy(new Error('Health-check response exceeded 64 KiB'));
          }
        });
        res.on('end', () => {
          let payload;
          try {
            payload = JSON.parse(data);
          } catch {
            finish({ status, healthy: false, error: 'Health-check response was not valid JSON' });
            return;
          }

          const applicationStatus = typeof payload?.status === 'string'
            ? payload.status.toLowerCase()
            : undefined;
          const healthy = status >= 200 && status < 300 && HEALTHY_RESPONSE_STATUSES.has(applicationStatus);

          finish({
            status,
            applicationStatus,
            healthy,
            error: healthy ? undefined : 'Health-check response did not explicitly report a healthy status'
          });
        });
      });

      req.on('error', (error) => {
        finish({ status: 0, healthy: false, error: error.message });
      });

      req.on('timeout', () => {
        req.destroy(new Error('Health-check request timed out'));
      });
    });
  }

  async storeHealthCheck(checkResult) {
    this.results.checks.push(checkResult);

    const { error } = await this.supabase.from('metrics_log').insert({
      source: 'healthcheck',
      metric: {
        type: 'health_check',
        url: checkResult.url,
        status: checkResult.status,
        applicationStatus: checkResult.applicationStatus,
        latency: checkResult.latency,
        healthy: checkResult.healthy,
        error: checkResult.error
      },
      ts: checkResult.timestamp
    });

    if (error) {
      throw new Error(`Failed to persist health-check result: ${error.message}`);
    }
  }

  async calculateUptime() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await this.supabase
      .from('metrics_log')
      .select('*')
      .eq('source', 'healthcheck')
      .gte('ts', sevenDaysAgo.toISOString())
      .order('ts', { ascending: false });

    if (error) {
      throw new Error(`Failed to read health-check history: ${error.message}`);
    }

    if (!data || data.length === 0) {
      const currentCheck = this.results.checks[0];
      this.results.uptime = currentCheck?.healthy === true ? 1 : 0;
      this.results.avgLatency = currentCheck?.latency || 0;
      return;
    }

    const healthyChecks = data.filter((entry) => entry.metric?.healthy === true);
    this.results.uptime = healthyChecks.length / data.length;

    const latencies = data
      .map((entry) => entry.metric?.latency)
      .filter((latency) => Number.isFinite(latency) && latency >= 0);

    if (latencies.length > 0) {
      this.results.avgLatency = Math.round(
        latencies.reduce((sum, latency) => sum + latency, 0) / latencies.length
      );
    }

    const orderedChecks = [...data].reverse();
    let failureStartedAt = null;
    let downtime = 0;

    for (const check of orderedChecks) {
      const checkTime = new Date(check.ts).getTime();
      if (!Number.isFinite(checkTime)) continue;

      if (check.metric?.healthy !== true && failureStartedAt === null) {
        failureStartedAt = checkTime;
      } else if (check.metric?.healthy === true && failureStartedAt !== null) {
        downtime += Math.max(0, checkTime - failureStartedAt);
        failureStartedAt = null;
      }
    }

    if (failureStartedAt !== null) {
      downtime += Math.max(0, Date.now() - failureStartedAt);
    }
    this.results.downtime = downtime;
  }

  async checkDowntimeAlerts() {
    const currentCheck = this.results.checks[0];
    if (currentCheck?.healthy !== true) {
      await this.addAlert({
        type: 'health_check',
        severity: 'critical',
        message: `Readiness check failed: ${currentCheck?.error || `HTTP ${currentCheck?.status || 0}`}`
      });
    }

    if (this.results.downtime > this.config.downtimeThreshold) {
      await this.addAlert({
        type: 'downtime',
        severity: 'high',
        message: `Downtime detected: ${Math.round(this.results.downtime / 1000)}s exceeds threshold of ${Math.round(this.config.downtimeThreshold / 1000)}s`
      });
    }

    if (this.results.uptime < this.config.uptimeThreshold) {
      await this.addAlert({
        type: 'uptime',
        severity: 'high',
        message: `Uptime ${(this.results.uptime * 100).toFixed(3)}% is below threshold of ${(this.config.uptimeThreshold * 100).toFixed(2)}%`
      });
    }
  }

  async addAlert(alert) {
    const timestampedAlert = { ...alert, timestamp: new Date().toISOString() };
    this.results.alerts.push(timestampedAlert);

    if (process.env.RELIABILITY_ALERT_WEBHOOK) {
      await this.sendWebhookAlert(process.env.RELIABILITY_ALERT_WEBHOOK, timestampedAlert);
    }
  }

  async sendWebhookAlert(webhookUrl, alert) {
    try {
      const url = new URL(webhookUrl);
      if (!['https:', 'http:'].includes(url.protocol)) {
        throw new Error('Webhook URL must use HTTP or HTTPS');
      }
      const client = url.protocol === 'https:' ? https : http;
      const payload = JSON.stringify({
        text: `Reliability Alert: ${alert.message}`,
        alert,
        timestamp: alert.timestamp
      });

      await new Promise((resolve, reject) => {
        const req = client.request({
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          res.resume();
          if (res.statusCode >= 200 && res.statusCode < 300) resolve();
          else reject(new Error(`Webhook returned HTTP ${res.statusCode || 0}`));
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.warn('Failed to send webhook alert:', error.message);
    }
  }
}
