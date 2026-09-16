import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('observability');

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';
import { monitoringSystem } from './monitoring';
import { withErrorBoundary, fireAndForget } from './error-boundaries';

// Type-safe metadata for log entries
type LogMetadata = Record<string, string | number | boolean | null | undefined>;

interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  timestamp: string;
  service: string;
  component: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata: LogMetadata;
  tags: string[];
}

// Type-safe metadata for trace spans
type SpanMetadata = Record<string, string | number | boolean | null | undefined>;

interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'started' | 'completed' | 'error';
  tags: Record<string, string>;
  logs: LogEntry[];
  metadata: SpanMetadata;
}

// Type-safe metadata for traces
type TraceMetadata = Record<string, string | number | boolean | null | undefined>;

interface Trace {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'started' | 'completed' | 'error';
  spans: TraceSpan[];
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata: TraceMetadata;
}

class ObservabilitySystem {
  private supabase: SupabaseClient;
  private activeTraces: Map<string, Trace> = new Map();
  private activeSpans: Map<string, TraceSpan> = new Map();

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  // Distributed Tracing
  async startTrace(
    name: string,
    userId?: string,
    sessionId?: string,
    requestId?: string,
    metadata: TraceMetadata = {}
  ): Promise<string> {
    try {
      const traceId = this.generateId();
      const trace: Trace = {
        id: traceId,
        name,
        startTime: new Date().toISOString(),
        status: 'started',
        spans: [],
        userId,
        sessionId,
        requestId,
        metadata,
      };

      this.activeTraces.set(traceId, trace);

      await _logger.debug(
        `Trace started: ${name}`,
        {
          traceId,
          name,
          userId,
          sessionId,
          requestId,
        },
        'observability',
        'tracing'
      );

      return traceId;
    } catch (error) {
      // Error handled: Failed to start trace:
      return '';
    }
  }

  async startSpan(
    traceId: string,
    name: string,
    parentId?: string,
    tags: Record<string, string> = {},
    metadata: SpanMetadata = {}
  ): Promise<string> {
    try {
      const spanId = this.generateId();
      const span: TraceSpan = {
        id: spanId,
        traceId,
        parentId,
        name,
        startTime: new Date().toISOString(),
        status: 'started',
        tags,
        logs: [],
        metadata,
      };

      this.activeSpans.set(spanId, span);

      const trace = this.activeTraces.get(traceId);
      if (trace) {
        trace.spans.push(span);
      }

      await _logger.debug(
        `Span started: ${name}`,
        {
          spanId,
          traceId,
          name,
          parentId,
        },
        'observability',
        'tracing'
      );

      return spanId;
    } catch (error) {
      // Error handled: Failed to start span:
      return '';
    }
  }

  async finishSpan(
    spanId: string,
    status: 'completed' | 'error' = 'completed',
    metadata: any = {}
  ): Promise<void> {
    try {
      const span = this.activeSpans.get(spanId);
      if (!span) {
        if (process.env.NODE_ENV === 'development') { _logger.warn('Span ${spanId} not found'); }
        return;
      }

      const endTime = new Date().toISOString();
      const duration =
        new Date(endTime).getTime() - new Date(span.startTime).getTime();

      span.endTime = endTime;
      span.duration = duration;
      span.status = status;
      span.metadata = { ...span.metadata, ...metadata };

      // Update trace if this is the root span
      const trace = this.activeTraces.get(span.traceId);
      if (trace && !span.parentId) {
        trace.endTime = endTime;
        trace.duration = duration;
        trace.status = status;
      }

      await _logger.debug(
        `Span finished: ${span.name}`,
        {
          spanId,
          traceId: span.traceId,
          name: span.name,
          duration,
          status,
        },
        'observability',
        'tracing'
      );

      // Store span in database
      await this.storeSpan(span);

      // Remove from active spans
      this.activeSpans.delete(spanId);
    } catch (error) {
      // Error handled: Failed to finish span:
    }
  }

  async finishTrace(
    traceId: string,
    status: 'completed' | 'error' = 'completed'
  ): Promise<void> {
    try {
      const trace = this.activeTraces.get(traceId);
      if (!trace) {
        if (process.env.NODE_ENV === 'development') { _logger.warn('Trace ${traceId} not found'); }
        return;
      }

      const endTime = new Date().toISOString();
      const duration =
        new Date(endTime).getTime() - new Date(trace.startTime).getTime();

      trace.endTime = endTime;
      trace.duration = duration;
      trace.status = status;

      await _logger.debug(
        `Trace finished: ${trace.name}`,
        {
          traceId,
          name: trace.name,
          duration,
          status,
        },
        'observability',
        'tracing'
      );

      // Store trace in database
      await this.storeTrace(trace);

      // Remove from active traces
      this.activeTraces.delete(traceId);
    } catch (error) {
      // Error handled: Failed to finish trace:
    }
  }

  async addSpanLog(
    spanId: string,
    level: string,
    message: string,
    metadata: any = {}
  ): Promise<void> {
    try {
      const span = this.activeSpans.get(spanId);
      if (!span) {
        if (process.env.NODE_ENV === 'development') { _logger.warn('Span ${spanId} not found'); }
        return;
      }

      const logEntry: LogEntry = {
        id: this.generateId(),
        level: level as any,
        message,
        timestamp: new Date().toISOString(),
        service: 'whats-for-dinner',
        component: 'observability',
        metadata,
        tags: [],
      };

      span.logs.push(logEntry);

      await _logger.debug(
        `Span log added: ${message}`,
        {
          spanId,
          traceId: span.traceId,
          level,
          message,
        },
        'observability',
        'tracing'
      );
    } catch (error) {
      // Error handled: Failed to add span log:
    }
  }

  async addSpanTag(spanId: string, key: string, value: string): Promise<void> {
    try {
      const span = this.activeSpans.get(spanId);
      if (!span) {
        if (process.env.NODE_ENV === 'development') { _logger.warn('Span ${spanId} not found'); }
        return;
      }

      span.tags[key] = value;

      await _logger.debug(
        `Span tag added: ${key} = ${value}`,
        {
          spanId,
          traceId: span.traceId,
          key,
          value,
        },
        'observability',
        'tracing'
      );
    } catch (error) {
      // Error handled: Failed to add span tag:
    }
  }

  private async storeSpan(span: TraceSpan): Promise<void> {
    try {
      await this.supabase.from('trace_spans').insert({
        id: span.id,
        trace_id: span.traceId,
        parent_id: span.parentId,
        name: span.name,
        start_time: span.startTime,
        end_time: span.endTime,
        duration: span.duration,
        status: span.status,
        tags: span.tags,
        logs: span.logs,
        metadata: span.metadata,
      });
    } catch (error) {
      // Error handled: Failed to store span:
    }
  }

  private async storeTrace(trace: Trace): Promise<void> {
    try {
      await this.supabase.from('traces').insert({
        id: trace.id,
        name: trace.name,
        start_time: trace.startTime,
        end_time: trace.endTime,
        duration: trace.duration,
        status: trace.status,
        user_id: trace.userId,
        session_id: trace.sessionId,
        request_id: trace.requestId,
        metadata: trace.metadata,
      });
    } catch (error) {
      // Error handled: Failed to store trace:
    }
  }

  // Structured Logging
  async log(
    level: string,
    message: string,
    metadata: any = {},
    tags: string[] = []
  ): Promise<void> {
    try {
      const logEntry: LogEntry = {
        id: this.generateId(),
        level: level as any,
        message,
        timestamp: new Date().toISOString(),
        service: 'whats-for-dinner',
        component: 'observability',
        metadata,
        tags,
      };

      // Store in database
      await this.supabase.from('structured_logs').insert({
        id: logEntry.id,
        level: logEntry.level,
        message: logEntry.message,
        timestamp: logEntry.timestamp,
        service: logEntry.service,
        component: logEntry.component,
        metadata: logEntry.metadata,
        tags: logEntry.tags,
      });

      // Also use the existing logger
      await logger[level as keyof typeof logger](
        message,
        metadata,
        'observability',
        'logging'
      );
    } catch (error) {
      // Error handled: Failed to log:
    }
  }

  // Performance Monitoring
  async recordPerformanceMetric(
    name: string,
    value: number,
    tags: Record<string, string> = {}
  ): Promise<void> {
    try {
      await monitoringSystem.recordMetric(name, value, tags);

      // Also record as performance-specific metric
      await this.supabase.from('performance_metrics').insert({
        name,
        value,
        tags,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Error handled: Failed to record performance metric:
    }
  }

  // Error Tracking
  async trackError(error: Error, context: any = {}): Promise<void> {
    try {
      const errorData = {
        id: this.generateId(),
        message: error.message,
        stack: error.stack,
        name: error.name,
        context,
        timestamp: new Date().toISOString(),
        severity: this.determineErrorSeverity(error),
      };

      await this.supabase.from('error_tracking').insert(errorData);

      await monitoringSystem.recordCounter('errors', 1, {
        error_type: error.name,
        severity: errorData.severity,
      });

      await this.log('error', `Error tracked: ${error.message}`, {
        errorId: errorData.id,
        errorName: error.name,
        severity: errorData.severity,
        context,
      });
    } catch (err) {
      _logger.error('Failed to track error:', { err });
    }
  }

  private determineErrorSeverity(
    error: Error
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (error.name === 'ValidationError') return 'low';
    if (error.name === 'AuthenticationError') return 'medium';
    if (error.name === 'AuthorizationError') return 'high';
    if (error.name === 'DatabaseError') return 'high';
    if (error.name === 'SecurityError') return 'critical';
    if (error.message.includes('prompt injection')) return 'critical';
    if (error.message.includes('unauthorized')) return 'high';
    return 'medium';
  }

  // Query and Analysis
  async getTraces(
    filters: {
      userId?: string;
      sessionId?: string;
      startTime?: string;
      endTime?: string;
      status?: string;
      limit?: number;
    } = {}
  ): Promise<Trace[]> {
    try {
      let query = this.supabase
        .from('traces')
        .select('*')
        .order('start_time', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.sessionId) {
        query = query.eq('session_id', filters.sessionId);
      }
      if (filters.startTime) {
        query = query.gte('start_time', filters.startTime);
      }
      if (filters.endTime) {
        query = query.lte('start_time', filters.endTime);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get traces: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      // Error handled: Failed to get traces:
      return [];
    }
  }

  async getSpans(traceId: string): Promise<TraceSpan[]> {
    try {
      const { data, error } = await this.supabase
        .from('trace_spans')
        .select('*')
        .eq('trace_id', traceId)
        .order('start_time', { ascending: true });

      if (error) {
        throw new Error(`Failed to get spans: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      // Error handled: Failed to get spans:
      return [];
    }
  }

  async getLogs(
    filters: {
      level?: string;
      service?: string;
      component?: string;
      startTime?: string;
      endTime?: string;
      limit?: number;
    } = {}
  ): Promise<LogEntry[]> {
    try {
      let query = this.supabase
        .from('structured_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.level) {
        query = query.eq('level', filters.level);
      }
      if (filters.service) {
        query = query.eq('service', filters.service);
      }
      if (filters.component) {
        query = query.eq('component', filters.component);
      }
      if (filters.startTime) {
        query = query.gte('timestamp', filters.startTime);
      }
      if (filters.endTime) {
        query = query.lte('timestamp', filters.endTime);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get logs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      // Error handled: Failed to get logs:
      return [];
    }
  }

  async getErrors(
    filters: {
      severity?: string;
      startTime?: string;
      endTime?: string;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    try {
      let query = this.supabase
        .from('error_tracking')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.startTime) {
        query = query.gte('timestamp', filters.startTime);
      }
      if (filters.endTime) {
        query = query.lte('timestamp', filters.endTime);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get errors: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      // Error handled: Failed to get errors:
      return [];
    }
  }

  // Health Checks
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, unknown>;
    metrics: any;
  }> {
    try {
      const health = await monitoringSystem.getHealthStatus();

      // Check individual components
      const components = {
        database: await this.checkDatabaseHealth(),
        logging: await this.checkLoggingHealth(),
        tracing: await this.checkTracingHealth(),
        monitoring: health.status,
      };

      const overallStatus = Object.values(components).some(
        c => c.status === 'unhealthy'
      )
        ? 'unhealthy'
        : Object.values(components).some(c => c.status === 'degraded')
          ? 'degraded'
          : 'healthy';

      return {
        status: overallStatus,
        components,
        metrics: health.metrics,
      };
    } catch (error) {
      // Error handled: Failed to get system health:
      return {
        status: 'unhealthy',
        components: {},
        metrics: {},
      };
    }
  }

  private async checkDatabaseHealth(): Promise<{
    status: string;
    details: any;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('system_metrics')
        .select('count')
        .limit(1);

      if (error) throw error;

      return {
        status: 'healthy',
        details: { connected: true },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  }

  private async checkLoggingHealth(): Promise<{
    status: string;
    details: any;
  }> {
    try {
      // Test logging
      await this.log('info', 'Health check test');
      return {
        status: 'healthy',
        details: { logging: true },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  }

  private async checkTracingHealth(): Promise<{
    status: string;
    details: any;
  }> {
    try {
      const traceId = await this.startTrace('health_check');
      await this.finishTrace(traceId);
      return {
        status: 'healthy',
        details: { tracing: true },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Create base instance
const baseObservabilitySystem = new ObservabilitySystem();

// Wrap critical methods with error boundaries (observability failures should not break user flows)
export const observabilitySystem = {
  startTrace: withErrorBoundary(
    baseObservabilitySystem.startTrace.bind(baseObservabilitySystem),
    (error) => {
      // Log but don't throw - observability failures shouldn't break user flows
      _logger.error('Observability trace start failed:', { error: error instanceof Error ? error.message : String(error) });
    },
    '' // fallback: return empty string on error
  ),
  finishTrace: withErrorBoundary(
    baseObservabilitySystem.finishTrace.bind(baseObservabilitySystem),
    (error) => _logger.error('Observability trace finish failed:', { error: error instanceof Error ? error.message : String(error) })
  ),
  startSpan: withErrorBoundary(
    baseObservabilitySystem.startSpan.bind(baseObservabilitySystem),
    (error) => _logger.error('Observability span start failed:', { error: error instanceof Error ? error.message : String(error) }),
    '' // fallback
  ),
  finishSpan: withErrorBoundary(
    baseObservabilitySystem.finishSpan.bind(baseObservabilitySystem),
    (error) => _logger.error('Observability span finish failed:', { error: error instanceof Error ? error.message : String(error) })
  ),
  log: fireAndForget(
    (level, message, metadata) => baseObservabilitySystem.log(level, message, metadata),
    (error) => _logger.error('Observability log failed:', { error: error instanceof Error ? error.message : String(error) })
  ),
  trackMetric: fireAndForget(
    (name, value, tags) => baseObservabilitySystem.trackMetric(name, value, tags),
    (error) => _logger.error('Observability metric tracking failed:', { error: error instanceof Error ? error.message : String(error) })
  ),
};

// Utility functions for common observability tasks
export const withTrace = withErrorBoundary(
  async function withTrace<T>(
    name: string,
    fn: (spanId: string) => Promise<T>,
    userId?: string,
    sessionId?: string,
    requestId?: string
  ): Promise<T> {
    const traceId = await observabilitySystem.startTrace(
      name,
      userId,
      sessionId,
      requestId
    );
    const spanId = await observabilitySystem.startSpan(traceId, name);

    try {
      const result = await fn(spanId);
      await observabilitySystem.finishSpan(spanId, 'completed');
      await observabilitySystem.finishTrace(traceId, 'completed');
      return result;
    } catch (error) {
      await observabilitySystem.finishSpan(spanId, 'error', {
        error: error.message,
      });
      await observabilitySystem.finishTrace(traceId, 'error');
      throw error;
    }
  },
  (error) => _logger.error('Observability withTrace failed:', { error: error instanceof Error ? error.message : String(error) })
);

export const withSpan = withErrorBoundary(
  async function withSpan<T>(
    traceId: string,
    name: string,
    fn: (spanId: string) => Promise<T>,
    parentId?: string
  ): Promise<T> {
    const spanId = await observabilitySystem.startSpan(traceId, name, parentId);

    try {
      const result = await fn(spanId);
      await observabilitySystem.finishSpan(spanId, 'completed');
      return result;
    } catch (error) {
      await observabilitySystem.finishSpan(spanId, 'error', {
        error: error.message,
      });
      throw error;
    }
  },
  (error) => _logger.error('Observability withSpan failed:', { error: error instanceof Error ? error.message : String(error) })
);

// Wrap trackError with error boundary (observability should never break user flows)
export const trackError = fireAndForget(
  async (error: Error, context: any = {}) => {
    await baseObservabilitySystem.trackError(error, context);
  },
  (error) => _logger.error('Observability trackError failed:', { error: error instanceof Error ? error.message : String(error) })
);
