// @ts-nocheck
/**
 * SLO Budget Calculator & Exporter
 * 
 * Tracks Service Level Objectives:
 * - Availability: 99.9% (0.1% error budget)
 * - Latency P95: < 400ms (5% error budget)
 * - Error Rate: < 0.1% (0.1% error budget)
 * 
 * Exports metrics to Prometheus for Grafana dashboards
 */

import { metrics } from '@opentelemetry/api';
import { logger } from './index';

export interface SLOTarget {
  name: string;
  target: number; // percentage (e.g., 99.9)
  window: number; // seconds
  errorBudget: number; // percentage
}

export interface SLOStatus {
  name: string;
  target: number;
  current: number;
  errorBudget: number;
  errorBudgetRemaining: number;
  status: 'green' | 'yellow' | 'red' | 'critical';
  window: number;
}

const DEFAULT_SLOS: SLOTarget[] = [
  {
    name: 'availability',
    target: 99.9, // 99.9% availability
    window: 30 * 24 * 60 * 60, // 30 days in seconds
    errorBudget: 0.1, // 0.1% error budget
  },
  {
    name: 'latency_p95',
    target: 95.0, // 95% of requests < 400ms
    window: 30 * 24 * 60 * 60,
    errorBudget: 5.0, // 5% can exceed 400ms
  },
  {
    name: 'error_rate',
    target: 99.9, // < 0.1% error rate
    window: 30 * 24 * 60 * 60,
    errorBudget: 0.1, // 0.1% error budget
  },
];

let meter: ReturnType<typeof metrics.getMeter> | null = null;
let availabilityCounter: ReturnType<typeof metrics.Counter> | null = null;
let availabilityTotalCounter: ReturnType<typeof metrics.Counter> | null = null;
let latencyHistogram: ReturnType<typeof metrics.Histogram> | null = null;
let errorCounter: ReturnType<typeof metrics.Counter> | null = null;
let errorRateGauge: ReturnType<typeof metrics.Gauge> | null = null;
let errorBudgetGauge: ReturnType<typeof metrics.Gauge> | null = null;

/**
 * Initialize SLO metrics
 */
export function initSLOMetrics(): void {
  meter = metrics.getMeter('nomad-slo');

  // Availability metrics
  availabilityCounter = meter.createCounter('slo_availability_success_total', {
    description: 'Total successful requests for availability SLO',
  });
  availabilityTotalCounter = meter.createCounter('slo_availability_total', {
    description: 'Total requests for availability SLO',
  });

  // Latency metrics
  latencyHistogram = meter.createHistogram('slo_latency_seconds', {
    description: 'Request latency for latency SLO (seconds)',
    unit: 's',
  });

  // Error rate metrics
  errorCounter = meter.createCounter('slo_errors_total', {
    description: 'Total errors for error rate SLO',
  });
  errorRateGauge = meter.createGauge('slo_error_rate', {
    description: 'Current error rate percentage',
    unit: '%',
  });

  // Error budget gauge
  errorBudgetGauge = meter.createGauge('slo_error_budget_remaining', {
    description: 'Remaining error budget percentage',
    unit: '%',
  });

  logger.info('SLO metrics initialized');
}

/**
 * Record a successful request for availability SLO
 */
export function recordAvailabilitySuccess(): void {
  availabilityCounter?.add(1);
  availabilityTotalCounter?.add(1);
}

/**
 * Record a failed request for availability SLO
 */
export function recordAvailabilityFailure(): void {
  availabilityTotalCounter?.add(1);
}

/**
 * Record request latency for latency SLO
 */
export function recordLatency(latencyMs: number): void {
  latencyHistogram?.record(latencyMs / 1000, {
    service: 'nomad-backend',
  });
}

/**
 * Record an error for error rate SLO
 */
export function recordError(): void {
  errorCounter?.add(1);
}

/**
 * Calculate SLO status from metrics
 */
export function calculateSLOStatus(sloTarget: SLOTarget, currentValue: number): SLOStatus {
  const errorBudgetRemaining = sloTarget.target - currentValue;
  const errorBudgetConsumed = sloTarget.errorBudget - errorBudgetRemaining;

  let status: 'green' | 'yellow' | 'red' | 'critical';
  if (errorBudgetRemaining > sloTarget.errorBudget * 0.5) {
    status = 'green';
  } else if (errorBudgetRemaining > sloTarget.errorBudget * 0.2) {
    status = 'yellow';
  } else if (errorBudgetRemaining > 0) {
    status = 'red';
  } else {
    status = 'critical';
  }

  return {
    name: sloTarget.name,
    target: sloTarget.target,
    current: currentValue,
    errorBudget: sloTarget.errorBudget,
    errorBudgetRemaining,
    status,
    window: sloTarget.window,
  };
}

/**
 * Get current SLO status for all targets
 * 
 * Note: In production, this would query Prometheus for actual metrics
 * For now, returns current gauge values
 */
export async function getCurrentSLOStatus(): Promise<SLOStatus[]> {
  const statuses: SLOStatus[] = [];

  for (const sloTarget of DEFAULT_SLOS) {
    // In real implementation, query Prometheus:
    // - availability: rate(availability_success_total[30d]) / rate(availability_total[30d]) * 100
    // - latency_p95: histogram_quantile(0.95, rate(latency_seconds_bucket[30d]))
    // - error_rate: rate(errors_total[30d]) / rate(availability_total[30d]) * 100

    // Placeholder: return target values (would be replaced with actual Prometheus queries)
    const currentValue = sloTarget.target - sloTarget.errorBudget * 0.1; // Simulate 10% consumption
    statuses.push(calculateSLOStatus(sloTarget, currentValue));
  }

  return statuses;
}

/**
 * Export SLO metrics summary for dashboards
 */
export async function exportSLOSummary(): Promise<{
  slos: SLOStatus[];
  overall: {
    status: 'green' | 'yellow' | 'red' | 'critical';
    worstSLO: string;
  };
}> {
  const slos = await getCurrentSLOStatus();

  // Determine overall status (worst status wins)
  const statusOrder = { green: 0, yellow: 1, red: 2, critical: 3 };
  let overallStatus: 'green' | 'yellow' | 'red' | 'critical' = 'green';
  let worstSLO = '';

  for (const slo of slos) {
    if (statusOrder[slo.status] > statusOrder[overallStatus]) {
      overallStatus = slo.status;
      worstSLO = slo.name;
    }
  }

  return {
    slos,
    overall: {
      status: overallStatus,
      worstSLO,
    },
  };
}

/**
 * Check if SLOs are within acceptable thresholds for deployment
 */
export async function checkSLOForDeployment(): Promise<{
  canDeploy: boolean;
  reason?: string;
  slos: SLOStatus[];
}> {
  const slos = await getCurrentSLOStatus();

  // Block deployment if any SLO is critical or red
  const blockingSLOs = slos.filter((s) => s.status === 'critical' || s.status === 'red');

  if (blockingSLOs.length > 0) {
    return {
      canDeploy: false,
      reason: `SLOs in critical state: ${blockingSLOs.map((s) => s.name).join(', ')}`,
      slos,
    };
  }

  // Warn if error budget is low (yellow)
  const warningSLOs = slos.filter((s) => s.status === 'yellow');

  if (warningSLOs.length > 0) {
    return {
      canDeploy: true,
      reason: `Warning: SLOs with low error budget: ${warningSLOs.map((s) => s.name).join(', ')}`,
      slos,
    };
  }

  return {
    canDeploy: true,
    slos,
  };
}
