// @ts-nocheck
import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../observability/index';

let redisConnection: Redis | null = null;

function getRedisConnection(): Redis {
  if (!redisConnection) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL must be set');
    }
    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        // Phase 1 Guardrail: Exponential backoff retry
        const delay = Math.min(times * 50, 2000);
        logger.warn({ retryAttempt: times, delay }, 'Redis connection retry');
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          logger.error({ error: err.message }, 'Redis read-only error, reconnecting');
          return true;
        }
        return false;
      },
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    });
    
    // Handle connection events
    redisConnection.on('connect', () => {
      logger.info('Redis connection established');
    });
    
    redisConnection.on('error', (err) => {
      logger.error({ error: err.message }, 'Redis connection error');
    });
    
    redisConnection.on('close', () => {
      logger.warn('Redis connection closed');
    });
    
    redisConnection.on('reconnecting', (delay) => {
      logger.info({ delay }, 'Redis reconnecting');
    });
  }
  return redisConnection;
}

const connection = getRedisConnection();

// Queue instances
export const queue = new Queue('nomad-jobs', {
  connection,
  defaultJobOptions: {
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 86400,
    },
  },
});

const queueEvents = new QueueEvents('nomad-jobs', { connection });

// Worker setup
export let worker: Worker | null = null;

export async function startWorker() {
  const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '5', 10);

  worker = new Worker(
    'nomad-jobs',
    async (job) => {
      logger.info({ jobId: job.id, jobName: job.name }, 'Processing job');

      switch (job.name) {
        case 'mealgen':
          const { mealGenProcessor } = await import('../jobs/mealGen');
          return await mealGenProcessor(job.data);
        case 'digest':
          const { digestProcessor } = await import('../jobs/digests');
          return await digestProcessor(job.data);
        case 'journeys':
          const { journeysRunnerProcessor } = await import('../jobs/journeysRunner');
          return await journeysRunnerProcessor(job.data);
        case 'digest_weekly':
          const { digestRunnerProcessor } = await import('../jobs/digestRunner');
          return await digestRunnerProcessor(job.data);
        case 'anomaly_guard':
          const { anomalyGuardProcessor } = await import('../jobs/anomalyGuard');
          return await anomalyGuardProcessor();
        case 'price_rollout':
          const { priceRolloutProcessor } = await import('../jobs/priceRollout');
          return await priceRolloutProcessor();
        case 'dsar_export':
          const { generateDSARExport } = await import('../jobs/dsarExport');
          return await generateDSARExport(job.data.requestId);
        case 'retention_run':
          const { runRetentionPolicies } = await import('../jobs/retentionRunner');
          return await runRetentionPolicies(job.data.dryRun || false);
        case 'erasure_run':
          const { runErasureJob } = await import('../jobs/erasureRunner');
          return await runErasureJob();
        case 'self_heal':
          const { runSelfHealing } = await import('../jobs/selfHeal');
          return await runSelfHealing(job.data || {});
        default:
          throw new Error(`Unknown job type: ${job.name}`);
      }
    },
    {
      connection,
      concurrency,
      removeOnComplete: {
        age: 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 86400,
      },
    },
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Job failed');
  });

  worker.on('error', (err) => {
    logger.error({ error: err.message }, 'Worker error');
  });

  logger.info({ concurrency }, 'Queue worker started');
}

// Graceful shutdown
export async function stopWorker() {
  if (worker) {
    await worker.close();
    worker = null;
  }
  await queue.close();
  await queueEvents.close();
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
  logger.info('Queue worker stopped');
}

// Health check (deprecated - use queue/health.ts)
export async function queueHealth(): Promise<{ healthy: boolean; pending: number; active: number }> {
  try {
    const [waiting, active] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
    ]);

    return {
      healthy: true,
      pending: waiting,
      active,
    };
  } catch (error) {
    logger.error({ error }, 'Queue health check failed');
    return {
      healthy: false,
      pending: 0,
      active: 0,
    };
  }
}

// Export health module
export { checkQueueHealth, getQueueMetrics } from './health';

// Handle process signals
process.on('SIGTERM', async () => {
  await stopWorker();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await stopWorker();
  process.exit(0);
});

// Auto-start worker if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker().catch((err) => {
    logger.error({ error: err }, 'Failed to start queue worker');
    process.exit(1);
  });
}
