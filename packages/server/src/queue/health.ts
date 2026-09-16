// @ts-nocheck
/**
 * Phase 1 Guardrail: Queue Worker Health Monitoring
 * Provides health check endpoints and monitoring for the queue worker
 */

import { worker, queue } from './index';
import { logger } from '../observability/index';
import type { Worker } from 'bullmq';

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
export async function checkQueueHealth(): Promise<QueueHealthStatus> {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
    ]);

    const workerStatus = worker as Worker | null;
    const isPaused = workerStatus?.isPaused() || false;
    const isRunning = workerStatus !== null && !isPaused;

    // Check Redis connection
    const redis = queue.client;
    let redisConnected = false;
    try {
      await redis.ping();
      redisConnected = true;
    } catch (error) {
      logger.error({ error }, 'Redis ping failed');
    }

    const healthy = isRunning && redisConnected && waiting < 10000; // Threshold for pending jobs

    return {
      healthy,
      worker: {
        running: isRunning,
        active,
        waiting,
        completed,
        failed,
        paused: isPaused,
      },
      redis: {
        connected: redisConnected,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error({ error }, 'Queue health check failed');
    return {
      healthy: false,
      worker: {
        running: false,
        active: 0,
        waiting: 0,
        completed: 0,
        failed: 0,
        paused: false,
      },
      redis: {
        connected: false,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get detailed queue metrics
 */
export async function getQueueMetrics() {
  const health = await checkQueueHealth();
  const jobs = await queue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 100);
  
  const recentJobs = await Promise.all(
    jobs.map(async (job) => ({
      id: job.id,
      name: job.name,
      state: await job.getState(),
      progress: job.progress,
      createdAt: job.timestamp,
    }))
  );

  return {
    health,
    recentJobs,
  };
}
