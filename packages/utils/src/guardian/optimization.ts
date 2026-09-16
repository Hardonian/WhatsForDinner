/**
 * Guardian Optimization Utilities
 * Performance optimizations and caching strategies
 */

import { Guardian } from './core';
import type { GuardianEvent, TrustReport } from './types';
const fs = typeof window === 'undefined' ? require('fs') : null;
const path = typeof window === 'undefined' ? require('path') : null;
import { createComponentLogger } from '../logger';

/**
 * Optimized Guardian with caching
 */
const logger = createComponentLogger('optimization-ts');
export class OptimizedGuardian extends Guardian {
  private riskCache: Map<string, { assessment: any; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(userId: string, ledgerDir?: string) {
    super(userId, ledgerDir);
  }

  /**
   * Cached risk assessment
   */
  assessRiskCached(
    scope: string,
    dataClass: string,
    metadata: Record<string, unknown> = {}
  ) {
    const cacheKey = `${scope}:${dataClass}:${JSON.stringify(metadata)}`;
    const cached = this.riskCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.assessment;
    }

    const assessment = this.assessRisk(scope as any, dataClass as any, metadata);
    this.riskCache.set(cacheKey, {
      assessment,
      timestamp: Date.now(),
    });

    return assessment;
  }

  clearCache(): void {
    this.riskCache.clear();
  }
}

/**
 * Batch ledger writer for performance
 */
export class BatchLedgerWriter {
  private queue: GuardianEvent[] = [];
  private batchSize = 100;
  private flushInterval = 60000; // 1 minute
  private timer: NodeJS.Timeout | null = null;

  constructor(private ledgerPath: string) {
    this.startTimer();
  }

  add(event: GuardianEvent): void {
    this.queue.push(event);

    if (this.queue.length >= this.batchSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const batch = [...this.queue];
    this.queue = [];

    const dir = path.dirname(this.ledgerPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const lines = batch.map(event => {
      const entry = {
        eventId: event.eventId,
        timestamp: event.timestamp,
        type: 'guardian_event',
        scope: event.scope,
        guardianAction: event.guardianAction,
        sha256: event.fingerprint,
        previousHash: event.previousHash,
        metadata: {
          dataClass: event.dataClass,
          action: event.action,
          target: event.target,
          riskScore: event.riskScore,
          riskLevel: event.riskLevel,
          explanation: event.explanation,
          ...event.metadata,
        },
      };
      return JSON.stringify(entry);
    }).join('\n') + '\n';

    await fs.promises.appendFile(this.ledgerPath, lines, 'utf-8');
  }

  private startTimer(): void {
    this.timer = setInterval(() => {
      this.flush().catch(err => {
        logger.error('Batch ledger flush failed:', { err });
      });
    }, this.flushInterval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    return this.flush();
  }
}

/**
 * Optimized Inspector with report caching
 */
export class OptimizedInspector {
  private reportCache: Map<string, { report: TrustReport; timestamp: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(private logsDir: string) {}

  async analyzeAndGenerateReportCached(
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<TrustReport> {
    const cacheKey = `${userId}:${periodStart.getTime()}:${periodEnd.getTime()}`;
    const cached = this.reportCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.report;
    }

    // Use regular inspector
    const { GuardianInspector } = await import('./inspector');
    const inspector = new GuardianInspector(this.logsDir);
    const report = await inspector.analyzeAndGenerateReport(userId, periodStart, periodEnd);

    this.reportCache.set(cacheKey, {
      report,
      timestamp: Date.now(),
    });

    return report;
  }

  clearCache(): void {
    this.reportCache.clear();
  }
}

/**
 * Compressed ledger storage for large-scale deployments
 */
export class CompressedLedgerWriter {
  private queue: GuardianEvent[] = [];
  private compressionThreshold = 1000; // Compress after 1000 events

  constructor(private ledgerPath: string) {}

  async addCompressed(event: GuardianEvent): Promise<void> {
    this.queue.push(event);

    if (this.queue.length >= this.compressionThreshold) {
      await this.compressAndWrite();
    }
  }

  private async compressAndWrite(): Promise<void> {
    const batch = [...this.queue];
    this.queue = [];

    // In production, use actual compression (e.g., gzip)
    const compressed = JSON.stringify(batch);
    const compressedPath = this.ledgerPath.replace('.jsonl', '.compressed.jsonl');

    await fs.promises.appendFile(compressedPath, compressed + '\n', 'utf-8');
  }

  async flush(): Promise<void> {
    if (this.queue.length > 0) {
      await this.compressAndWrite();
    }
  }
}

/**
 * Performance monitoring for Guardian operations
 */
export class GuardianPerformanceMonitor {
  private metrics: {
    eventProcessingTime: number[];
    riskAssessmentTime: number[];
    ledgerWriteTime: number[];
  } = {
    eventProcessingTime: [],
    riskAssessmentTime: [],
    ledgerWriteTime: [],
  };

  recordEventProcessing(duration: number): void {
    this.metrics.eventProcessingTime.push(duration);
    if (this.metrics.eventProcessingTime.length > 1000) {
      this.metrics.eventProcessingTime.shift();
    }
  }

  recordRiskAssessment(duration: number): void {
    this.metrics.riskAssessmentTime.push(duration);
    if (this.metrics.riskAssessmentTime.length > 1000) {
      this.metrics.riskAssessmentTime.shift();
    }
  }

  recordLedgerWrite(duration: number): void {
    this.metrics.ledgerWriteTime.push(duration);
    if (this.metrics.ledgerWriteTime.length > 1000) {
      this.metrics.ledgerWriteTime.shift();
    }
  }

  getStats(): {
    eventProcessing: { avg: number; p95: number; p99: number };
    riskAssessment: { avg: number; p95: number; p99: number };
    ledgerWrite: { avg: number; p95: number; p99: number };
  } {
    const percentile = (arr: number[], p: number) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor((sorted.length - 1) * p)];
    };

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length || 0;

    return {
      eventProcessing: {
        avg: avg(this.metrics.eventProcessingTime),
        p95: percentile(this.metrics.eventProcessingTime, 0.95),
        p99: percentile(this.metrics.eventProcessingTime, 0.99),
      },
      riskAssessment: {
        avg: avg(this.metrics.riskAssessmentTime),
        p95: percentile(this.metrics.riskAssessmentTime, 0.95),
        p99: percentile(this.metrics.riskAssessmentTime, 0.99),
      },
      ledgerWrite: {
        avg: avg(this.metrics.ledgerWriteTime),
        p95: percentile(this.metrics.ledgerWriteTime, 0.95),
        p99: percentile(this.metrics.ledgerWriteTime, 0.99),
      },
    };
  }
}

export const performanceMonitor = new GuardianPerformanceMonitor();
