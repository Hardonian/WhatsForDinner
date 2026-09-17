/**
 * Phase 1 Guardrail: Queue Worker Health Monitoring
 * Provides health check endpoints and monitoring for the queue worker
 */
export interface QueueHealthStatus {
    healthy: boolean;
    worker: {
        running: boolean;
        active: number;
        waiting: number;
        completed: number;
        failed: number;
        paused: boolean;
    };
    redis: {
        connected: boolean;
    };
    timestamp: string;
}
/**
 * Check queue worker health
 */
export declare function checkQueueHealth(): Promise<QueueHealthStatus>;
/**
 * Get detailed queue metrics
 */
export declare function getQueueMetrics(): Promise<{
    health: QueueHealthStatus;
    recentJobs: {
        id: string | undefined;
        name: string;
        state: "unknown" | import("bullmq").JobState;
        progress: import("bullmq").JobProgress;
        createdAt: number;
    }[];
}>;
//# sourceMappingURL=health.d.ts.map