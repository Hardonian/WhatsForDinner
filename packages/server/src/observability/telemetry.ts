// @ts-nocheck
/**
 * Observability suite with OpenTelemetry
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

export function initializeObservability() {
  const serviceName = process.env.OTEL_SERVICE_NAME || 'whats-for-dinner';
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  const sdk = new NodeSDK({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
    }),
    traceExporter: otlpEndpoint
      ? new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` })
      : undefined,
    metricReader: new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: 60000, // Every minute
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  // Metrics
  const metrics = {
    p95Latency: 0,
    errorRate: 0,
    cost: 0,
  };

  // Collect metrics periodically
  setInterval(() => {
    // In production, collect from actual metrics
      }, 60000);

  return {
    sdk,
    metrics,
    shutdown: () => sdk.shutdown(),
  };
}

// Export for use in apps
export default initializeObservability;
