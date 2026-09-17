// @ts-nocheck
/**
 * OpenTelemetry Global Tracer & Metrics Exporter
 *
 * Initializes global OpenTelemetry SDK with:
 * - OTLP trace exporter (Tempo-compatible)
 * - Prometheus metrics exporter
 * - Auto-instrumentation for HTTP, DB, Redis
 * - Resource attributes (service name, version, environment)
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT, } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { trace, metrics } from '@opentelemetry/api';
import { logger } from './index';
let sdk = null;
let meterProvider = null;
/**
 * Initialize global OpenTelemetry SDK
 */
export async function initOpenTelemetrySDK(config = {}) {
    if (sdk) {
        logger.warn('OpenTelemetry SDK already initialized');
        return;
    }
    const serviceName = config.serviceName || process.env.OTEL_SERVICE_NAME || 'nomad-backend';
    const serviceVersion = config.serviceVersion || process.env.npm_package_version || '1.0.0';
    const environment = config.environment || process.env.NODE_ENV || 'production';
    const otlpEndpoint = config.otlpEndpoint || process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    const prometheusPort = config.prometheusPort || parseInt(process.env.PROMETHEUS_PORT || '9464', 10);
    const enablePrometheus = config.enablePrometheus ?? process.env.ENABLE_PROMETHEUS !== 'false';
    const enableOTLP = config.enableOTLP ?? process.env.ENABLE_OTLP !== 'false';
    const resource = new Resource({
        [SEMRESATTRS_SERVICE_NAME]: serviceName,
        [SEMRESATTRS_SERVICE_VERSION]: serviceVersion,
        [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
        'nomad.service.type': 'backend',
        'nomad.deployment.platform': process.env.VERCEL ? 'vercel' : 'unknown',
    });
    // Initialize metrics provider
    if (enablePrometheus) {
        const prometheusExporter = new PrometheusExporter({
            port: prometheusPort,
            endpoint: '/metrics',
        });
        meterProvider = new MeterProvider({
            resource,
            readers: [
                new PeriodicExportingMetricReader({
                    exportIntervalMillis: 60000, // 1 minute
                    exporter: prometheusExporter,
                }),
                ...(enableOTLP && otlpEndpoint
                    ? [
                        new PeriodicExportingMetricReader({
                            exportIntervalMillis: 30000, // 30 seconds
                            exporter: new OTLPMetricExporter({
                                url: `${otlpEndpoint}/v1/metrics`,
                            }),
                        }),
                    ]
                    : []),
            ],
        });
        metrics.setGlobalMeterProvider(meterProvider);
        logger.info({ port: prometheusPort }, 'Prometheus metrics exporter initialized');
    }
    // Initialize tracing SDK
    sdk = new NodeSDK({
        resource,
        traceExporter: enableOTLP && otlpEndpoint
            ? new OTLPTraceExporter({
                url: `${otlpEndpoint}/v1/traces`,
            })
            : undefined,
        instrumentations: [
            getNodeAutoInstrumentations({
                '@opentelemetry/instrumentation-http': {
                    enabled: true,
                    ignoreIncomingRequestHook: (req) => {
                        // Ignore health checks and metrics endpoints
                        return req.url?.includes('/healthz') || req.url?.includes('/metrics');
                    },
                },
                '@opentelemetry/instrumentation-express': {
                    enabled: true,
                },
                '@opentelemetry/instrumentation-pg': {
                    enabled: true,
                },
                '@opentelemetry/instrumentation-redis': {
                    enabled: true,
                },
            }),
        ],
    });
    sdk.start();
    logger.info({
        serviceName,
        serviceVersion,
        environment,
        otlpEndpoint: otlpEndpoint || 'disabled',
        prometheusPort: enablePrometheus ? prometheusPort : 'disabled',
    }, 'OpenTelemetry SDK initialized');
}
/**
 * Get global tracer
 */
export function getTracer(name = 'nomad-backend') {
    return trace.getTracer(name);
}
/**
 * Get global meter
 */
export function getMeter(name = 'nomad-backend') {
    return metrics.getMeter(name);
}
/**
 * Shutdown OpenTelemetry SDK gracefully
 */
export async function shutdownOpenTelemetry() {
    if (meterProvider) {
        await meterProvider.shutdown();
        meterProvider = null;
    }
    if (sdk) {
        await sdk.shutdown();
        sdk = null;
        logger.info('OpenTelemetry SDK shutdown');
    }
}
/**
 * Create a span with automatic error handling
 */
export async function withSpan(name, fn) {
    const tracer = getTracer();
    const span = tracer.startSpan(name);
    try {
        const result = await fn(span);
        span.setStatus({ code: 1 }); // OK
        return result;
    }
    catch (error) {
        span.setStatus({
            code: 2, // ERROR
            message: error instanceof Error ? error.message : String(error),
        });
        span.recordException(error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
    finally {
        span.end();
    }
}
