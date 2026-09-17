/**
 * API Telemetry Middleware
 * 
 * Adds OpenTelemetry tracing to API routes
 * Tracks request duration, status codes, and errors
 */

import { NextRequest, NextResponse } from 'next/server';

// Optional OpenTelemetry integration with graceful fallback
const SpanStatusCode = {
  UNSET: 0,
  OK: 1,
  ERROR: 2,
};

let otelApi: any = null;
try {
  otelApi = eval('require')('@opentelemetry/api');
} catch {}

const trace = otelApi?.trace || {
  getTracer: () => ({
    startSpan: () => ({
      setAttributes: () => {},
      setStatus: () => {},
      recordException: () => {},
      end: () => {},
    }),
  }),
};

const context = otelApi?.context || {
  active: () => ({}),
  with: (_ctx: any, fn: () => any) => fn(),
};

/**
 * Wrap API route handler with telemetry
 */
export function withTelemetry<T extends (...args: unknown[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    const tracer = trace.getTracer('api-handler');
    const span = tracer.startSpan(`HTTP ${request.method} ${request.nextUrl.pathname}`);

    try {
      span.setAttributes({
        'http.method': request.method,
        'http.url': request.nextUrl.pathname,
        'http.route': request.nextUrl.pathname,
        'user_agent': request.headers.get('user-agent') || '',
      });

      const result = await context.with(trace.setSpan(context.active(), span), async () => {
        return await handler(...args);
      });

      span.setAttributes({
        'http.status_code': result.status,
        'http.status_text': result.statusText,
      });

      if (result.status >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${result.status}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message || 'Unknown error',
      });

      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }) as T;
}

/**
 * Create a traced API route handler
 */
export function tracedRoute(handler: (req: NextRequest) => Promise<NextResponse>) {
  return withTelemetry(handler);
}
