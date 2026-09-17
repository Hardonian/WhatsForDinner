// @ts-nocheck
import pino from 'pino';
// Pino logger with redaction
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
        paths: [
            'password',
            'token',
            'email',
            '*.password',
            '*.token',
            '*.email',
            'req.headers.authorization',
            'req.headers.cookie',
        ],
        remove: true,
    },
    transport: process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
            },
        }
        : undefined,
});
// OpenTelemetry setup
let otelInitialized = false;
export async function initOpenTelemetry() {
    if (otelInitialized) {
        return;
    }
    try {
        const { NodeSDK } = await import('@opentelemetry/sdk-node');
        const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
        const { Resource } = await import('@opentelemetry/resources');
        const { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } = await import('@opentelemetry/semantic-conventions');
        const sdk = new NodeSDK({
            resource: new Resource({
                [SEMRESATTRS_SERVICE_NAME]: 'nomad-backend',
                [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
            }),
            traceExporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
                ? (await import('@opentelemetry/exporter-trace-otlp-http')).OTLPTraceExporter
                : undefined,
            instrumentations: [getNodeAutoInstrumentations()],
        });
        sdk.start();
        otelInitialized = true;
        logger.info('OpenTelemetry initialized');
    }
    catch (error) {
        logger.warn({ error }, 'Failed to initialize OpenTelemetry');
    }
}
// Metrics setup
let metricsRegistry = null;
export async function initMetrics() {
    if (metricsRegistry) {
        return metricsRegistry;
    }
    try {
        const { MeterProvider } = await import('@opentelemetry/sdk-metrics');
        const { PrometheusExporter } = await import('@opentelemetry/exporter-prometheus');
        const { Resource } = await import('@opentelemetry/resources');
        const { SEMRESATTRS_SERVICE_NAME } = await import('@opentelemetry/semantic-conventions');
        const exporter = new PrometheusExporter({
            port: 9464,
        });
        const provider = new MeterProvider({
            resource: new Resource({
                [SEMRESATTRS_SERVICE_NAME]: 'nomad-backend',
            }),
            readers: [exporter],
        });
        metricsRegistry = provider;
        logger.info('Metrics initialized on port 9464');
        return provider;
    }
    catch (error) {
        logger.warn({ error }, 'Failed to initialize metrics');
        return null;
    }
}
