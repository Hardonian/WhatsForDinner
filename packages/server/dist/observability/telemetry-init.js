// @ts-nocheck
/**
 * OpenTelemetry Telemetry Initialization
 *
 * Centralized telemetry setup for all services
 * Supports tracing, metrics, and logging
 */
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { createComponentLogger } from '@whats-for-dinner/utils';
let sdk = null;
let initialized = false;
/**
 * Initialize OpenTelemetry SDK
 */
const logger = createComponentLogger('telemetry-init-ts');
export function initializeTelemetry() {
    if (initialized) {
        return;
    }
    const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    const serviceName = process.env.OTEL_SERVICE_NAME || 'whats-for-dinner-backend';
    const enableOtlp = process.env.ENABLE_OTLP !== 'false';
    // Only initialize if OTLP endpoint is configured or in development
    if (!enableOtlp && !otlpEndpoint && process.env.NODE_ENV !== 'development') {
        logger.info('📊 OpenTelemetry: Disabled (no OTLP endpoint configured)');
        initialized = true;
        return;
    }
    try {
        const resource = new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
            [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
            [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
        });
        const sdkConfig = {
            resource,
            instrumentations: [
                getNodeAutoInstrumentations({
                    // Disable fs instrumentation in production for performance
                    '@opentelemetry/instrumentation-fs': {
                        enabled: process.env.NODE_ENV === 'development',
                    },
                }),
            ],
            ...(otlpEndpoint
                ? {
                    traceExporter: new OTLPTraceExporter({
                        url: `${otlpEndpoint}/v1/traces`,
                    }),
                }
                : {}),
            ...(process.env.NODE_ENV === 'development'
                ? {
                    metricReader: new PeriodicExportingMetricReader({
                        exporter: new ConsoleMetricExporter(),
                        exportIntervalMillis: 10000,
                    }),
                }
                : {}),
        };
        sdk = new NodeSDK(sdkConfig);
        sdk.start();
        initialized = true;
        logger.info(`✅ OpenTelemetry initialized: ${serviceName}`);
        if (otlpEndpoint) {
            logger.info(`   📡 OTLP Endpoint: ${otlpEndpoint}`);
        }
        else {
            logger.info('   📡 OTLP: Console exporter (development mode)');
        }
    }
    catch (error) {
        logger.error('❌ Failed to initialize OpenTelemetry:', { error });
        // Don't throw - telemetry failures shouldn't break the app
    }
}
/**
 * Shutdown telemetry SDK gracefully
 */
export async function shutdownTelemetry() {
    if (sdk) {
        try {
            await sdk.shutdown();
            logger.info('✅ OpenTelemetry shutdown complete');
        }
        catch (error) {
            logger.error('❌ Error shutting down OpenTelemetry:', { error });
        }
    }
}
/**
 * Auto-initialize in Node.js environments
 */
if (typeof require !== 'undefined' && require.main === module) {
    initializeTelemetry();
}
// Auto-initialize on import in server environments
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
    initializeTelemetry();
}
export { sdk };
