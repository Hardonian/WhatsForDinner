// @ts-nocheck
/**
 * Incident Management Automation
 *
 * Automatically detects, creates, and triages incidents based on:
 * - Error rate spikes
 * - SLO violations
 * - Health check failures
 * - External alert webhooks
 *
 * Features:
 * - Auto-incident creation with severity assessment
 * - Triage assignment based on severity
 * - Slack/PagerDuty notifications
 * - Timeline auto-append
 */
import { createIncident, updateIncident, addTimelineEntry } from './service';
import { logger } from '../observability/index';
import { getCurrentSLOStatus } from '../observability/slo';
import { aggregateHealthCheck } from '../observability/health';
/**
 * Detect error rate spike from metrics
 */
export async function detectErrorRateSpike(currentErrorRate, baselineErrorRate, config) {
    const delta = currentErrorRate - baselineErrorRate;
    const percentIncrease = baselineErrorRate > 0 ? (delta / baselineErrorRate) * 100 : 0;
    if (currentErrorRate > config.errorRateThreshold || percentIncrease > 50) {
        let severity = 'low';
        if (currentErrorRate > 5.0 || percentIncrease > 200) {
            severity = 'critical';
        }
        else if (currentErrorRate > 2.0 || percentIncrease > 100) {
            severity = 'major';
        }
        return {
            type: 'error_rate_spike',
            severity,
            title: `Error Rate Spike Detected: ${currentErrorRate.toFixed(2)}%`,
            summary: `Error rate increased from ${baselineErrorRate.toFixed(2)}% to ${currentErrorRate.toFixed(2)}% (${percentIncrease.toFixed(1)}% increase)`,
            metrics: {
                currentErrorRate,
                baselineErrorRate,
                percentIncrease,
            },
            threshold: config.errorRateThreshold,
        };
    }
    return null;
}
/**
 * Detect SLO violations
 */
export async function detectSLOViolations() {
    const sloStatus = await getCurrentSLOStatus();
    const criticalSLOs = sloStatus.filter((slo) => slo.status === 'critical');
    const redSLOs = sloStatus.filter((slo) => slo.status === 'red');
    if (criticalSLOs.length > 0) {
        const worstSLO = criticalSLOs[0];
        return {
            type: 'slo_violation',
            severity: 'critical',
            title: `SLO Critical Violation: ${worstSLO.name}`,
            summary: `SLO "${worstSLO.name}" is in critical state. Target: ${worstSLO.target}%, Current: ${worstSLO.current.toFixed(2)}%, Error budget remaining: ${worstSLO.errorBudgetRemaining.toFixed(2)}%`,
            metrics: {
                target: worstSLO.target,
                current: worstSLO.current,
                errorBudgetRemaining: worstSLO.errorBudgetRemaining,
            },
        };
    }
    if (redSLOs.length > 0) {
        const worstSLO = redSLOs[0];
        return {
            type: 'slo_violation',
            severity: 'major',
            title: `SLO Violation: ${worstSLO.name}`,
            summary: `SLO "${worstSLO.name}" is in red state. Target: ${worstSLO.target}%, Current: ${worstSLO.current.toFixed(2)}%, Error budget remaining: ${worstSLO.errorBudgetRemaining.toFixed(2)}%`,
            metrics: {
                target: worstSLO.target,
                current: worstSLO.current,
                errorBudgetRemaining: worstSLO.errorBudgetRemaining,
            },
        };
    }
    return null;
}
/**
 * Detect health check failures
 */
export async function detectHealthCheckFailures() {
    const health = await aggregateHealthCheck();
    if (health.status === 'unhealthy') {
        const unhealthyServices = Object.entries(health.services)
            .filter(([_, service]) => service.status === 'unhealthy')
            .map(([name]) => name);
        return {
            type: 'health_check_failure',
            severity: 'critical',
            title: `Health Check Failure: ${unhealthyServices.join(', ')}`,
            summary: `Health check failed for services: ${unhealthyServices.join(', ')}. System status: ${health.status}`,
            metrics: {
                unhealthyServices: unhealthyServices.length,
                totalServices: Object.keys(health.services).length,
            },
        };
    }
    if (health.status === 'degraded') {
        const degradedServices = Object.entries(health.services)
            .filter(([_, service]) => service.status === 'degraded')
            .map(([name]) => name);
        return {
            type: 'health_check_failure',
            severity: 'major',
            title: `Health Check Degraded: ${degradedServices.join(', ')}`,
            summary: `Health check degraded for services: ${degradedServices.join(', ')}. System status: ${health.status}`,
            metrics: {
                degradedServices: degradedServices.length,
                totalServices: Object.keys(health.services).length,
            },
        };
    }
    return null;
}
/**
 * Create incident from trigger
 */
export async function createIncidentFromTrigger(trigger, config) {
    try {
        const incidentId = await createIncident({
            title: trigger.title,
            severity: trigger.severity,
            summary: trigger.summary,
            openedBy: config.systemUserId,
        });
        // Add metrics to timeline
        if (trigger.metrics) {
            await addTimelineEntry(incidentId, config.systemUserId, 'metrics_captured', {
                metrics: trigger.metrics,
                triggerType: trigger.type,
            });
        }
        // Send notifications
        await sendNotifications(incidentId, trigger, config);
        logger.info({ incidentId, trigger: trigger.type }, 'Auto-incident created');
        return incidentId;
    }
    catch (error) {
        logger.error({ error, trigger }, 'Failed to create auto-incident');
        return null;
    }
}
/**
 * Send notifications (Slack/PagerDuty)
 */
async function sendNotifications(incidentId, trigger, config) {
    const message = {
        incidentId,
        title: trigger.title,
        severity: trigger.severity,
        summary: trigger.summary,
        timestamp: new Date().toISOString(),
    };
    // Slack notification
    if (config.slackWebhook) {
        try {
            await fetch(config.slackWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: `?? Incident Created: ${trigger.title}`,
                    attachments: [
                        {
                            color: trigger.severity === 'critical' ? 'danger' : trigger.severity === 'major' ? 'warning' : 'good',
                            fields: [
                                { title: 'Severity', value: trigger.severity, short: true },
                                { title: 'Type', value: trigger.type, short: true },
                                { title: 'Summary', value: trigger.summary, short: false },
                                { title: 'Incident ID', value: incidentId, short: true },
                            ],
                        },
                    ],
                }),
            });
        }
        catch (error) {
            logger.error({ error }, 'Failed to send Slack notification');
        }
    }
    // PagerDuty notification (for critical only)
    if (config.pagerdutyApiKey && trigger.severity === 'critical') {
        try {
            await fetch('https://api.pagerduty.com/incidents', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token token=${config.pagerdutyApiKey}`,
                },
                body: JSON.stringify({
                    incident: {
                        type: 'incident',
                        title: trigger.title,
                        service: {
                            id: 'nomad-backend',
                            type: 'service_reference',
                        },
                        priority: {
                            id: 'P1',
                            type: 'priority_reference',
                        },
                        body: {
                            type: 'incident_body',
                            details: trigger.summary,
                        },
                    },
                }),
            });
        }
        catch (error) {
            logger.error({ error }, 'Failed to send PagerDuty notification');
        }
    }
}
/**
 * Run incident detection cycle
 */
export async function runIncidentDetection(config) {
    const createdIncidents = [];
    // Check error rate spike (would query Prometheus in production)
    // const currentErrorRate = await queryErrorRate(config.errorRateWindow);
    // const baselineErrorRate = await queryBaselineErrorRate();
    // const errorTrigger = await detectErrorRateSpike(currentErrorRate, baselineErrorRate, config);
    // if (errorTrigger) {
    //   const id = await createIncidentFromTrigger(errorTrigger, config);
    //   if (id) createdIncidents.push(id);
    // }
    // Check SLO violations
    const sloTrigger = await detectSLOViolations();
    if (sloTrigger) {
        const id = await createIncidentFromTrigger(sloTrigger, config);
        if (id)
            createdIncidents.push(id);
    }
    // Check health check failures
    const healthTrigger = await detectHealthCheckFailures();
    if (healthTrigger) {
        const id = await createIncidentFromTrigger(healthTrigger, config);
        if (id)
            createdIncidents.push(id);
    }
    return createdIncidents;
}
/**
 * Auto-update incident timeline based on metrics
 */
export async function autoUpdateIncidentTimeline(incidentId, updates, config) {
    if (updates.status) {
        await updateIncident(incidentId, config.systemUserId, {
            status: updates.status,
        });
    }
    if (updates.metrics || updates.notes) {
        await addTimelineEntry(incidentId, config.systemUserId, 'auto_update', {
            metrics: updates.metrics,
            notes: updates.notes,
            timestamp: new Date().toISOString(),
        });
    }
}
/**
 * Default configuration
 */
export function getDefaultConfig() {
    return {
        errorRateThreshold: 1.0, // 1%
        errorRateWindow: 300, // 5 minutes
        slackWebhook: process.env.SLACK_ALERT_WEBHOOK,
        pagerdutyApiKey: process.env.PAGERDUTY_API_KEY,
        autoAssignTriage: true,
        systemUserId: process.env.SYSTEM_USER_ID || 'system',
    };
}
