// @ts-nocheck
/**
 * OpenTelemetry Telemetry Instrumentation
 * Provides structured logging, tracing, and metrics
 */

import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { createComponentLogger } from '../logger';

const logger = createComponentLogger('telemetry-ts');
interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  enabled: boolean;
}

class TelemetryService {
  private config: TelemetryConfig;
  private tracer: any;

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = {
      serviceName: config.serviceName || process.env.OTEL_SERVICE_NAME || 'whats-for-dinner',
      serviceVersion: config.serviceVersion || process.env.npm_package_version || '1.0.0',
      environment: config.environment || process.env.NODE_ENV || 'development',
      enabled: config.enabled ?? process.env.ENABLE_OTLP !== 'false',
    };

    if (this.config.enabled) {
      this.initializeTracer();
    }
  }

  /**
   * Initialize OpenTelemetry tracer
   */
  private initializeTracer(): void {
    try {
      // Tracer will be initialized by OpenTelemetry SDK
      this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion);
    } catch (error) {
      logger.warn('Failed to initialize OpenTelemetry tracer:', { error });
    }
  }

  /**
   * Create a span for tracing
   */
  startSpan(name: string, attributes?: Record<string, unknown>): unknown {
    if (!this.config.enabled || !this.tracer) {
      return { end: () => {}, setStatus: () => {}, setAttributes: () => {} };
    }

    const span = this.tracer.startSpan(name, {
      attributes: {
        ...attributes,
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
      },
    });

    return {
      end: () => span.end(),
      setStatus: (status: { code: SpanStatusCode; message?: string }) => {
        span.setStatus(status);
      },
      setAttributes: (attrs: Record<string, unknown>) => {
        span.setAttributes(attrs);
      },
      recordException: (error: Error) => {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      },
    };
  }

  /**
   * Log an event with structured data
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.serviceName,
      environment: this.config.environment,
      ...metadata,
    };

    // Use console for now, can be extended to send to logging service
    switch (level) {
      case 'debug':
        logger.debug(JSON.stringify(logEntry));
        break;
      case 'info':
        logger.info(JSON.stringify(logEntry));
        break;
      case 'warn':
        logger.warn(JSON.stringify(logEntry));
        break;
      case 'error':
        logger.error(JSON.stringify(logEntry));
        break;
    }
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, value: number, unit: string = '', attributes?: Record<string, unknown>): void {
    if (!this.config.enabled) return;

    // Metric recording would be implemented with OpenTelemetry metrics API
    this.log('info', `Metric: ${name}`, {
      metric: name,
      value,
      unit,
      ...attributes,
    });
  }

  /**
   * Track an error
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    const span = this.startSpan('error', {
      'error.name': error.name,
      'error.message': error.message,
      'error.stack': error.stack,
      ...context,
    });

    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.end();

    this.log('error', error.message, {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      ...context,
    });
  }

  /**
   * Track API request
   */
  trackApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    attributes?: Record<string, unknown>
  ): void {
    const span = this.startSpan(`${method} ${path}`, {
      'http.method': method,
      'http.route': path,
      'http.status_code': statusCode,
      'http.duration_ms': duration,
      ...attributes,
    });

    span.setStatus({
      code: statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.OK,
    });
    span.end();

    this.recordMetric('http.requests', 1, 'count', {
      method,
      path,
      status_code: statusCode,
    });

    this.recordMetric('http.request.duration', duration, 'ms', {
      method,
      path,
      status_code: statusCode,
    });
  }
}

// Singleton instance
export const telemetry = new TelemetryService();

// Export convenience functions
export const log = {
  debug: (message: string, metadata?: Record<string, unknown>) => telemetry.log('debug', message, metadata),
  info: (message: string, metadata?: Record<string, unknown>) => telemetry.log('info', message, metadata),
  warn: (message: string, metadata?: Record<string, unknown>) => telemetry.log('warn', message, metadata),
  error: (message: string, metadata?: Record<string, unknown>) => telemetry.log('error', message, metadata),
};

export const trackError = (error: Error, context?: Record<string, unknown>) => telemetry.trackError(error, context);
export const trackApiRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  attributes?: Record<string, unknown>
) => telemetry.trackApiRequest(method, path, statusCode, duration, attributes);
