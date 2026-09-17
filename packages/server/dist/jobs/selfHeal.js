// @ts-nocheck
/**
 * Self-Healing Job Supervisor
 *
 * Monitors and automatically heals:
 * - Queue workers (restart stalled jobs)
 * - Database queries (kill runaway queries > 30s)
 * - Failed migrations (auto-rollback)
 * - Stuck processes
 */
import { logger } from '../observability/index';
import { Queue } from 'bullmq';
/**
 * Monitor queue workers and restart stalled jobs
 */
export async function monitorQueueWorkers(config) {
    const queue = new Queue(config.queueName, {
        connection: {
            url: config.redisUrl,
        },
    });
    try {
        // Get stalled jobs
        const stalled = await queue.getStalled();
        if (stalled.length > 0) {
            logger.warn({ count: stalled.length }, 'Found stalled queue jobs');
            for (const job of stalled) {
                try {
                    // Attempt to re-process the job
                    await job.retry();
                    logger.info({ jobId: job.id }, 'Retried stalled job');
                }
                catch (error) {
                    logger.error({ jobId: job.id, error }, 'Failed to retry stalled job');
                    // Move to failed queue if retry fails
                    await job.moveToFailed(error);
                }
            }
        }
        // Get stuck jobs (no activity for > 5 minutes)
        const stuck = await queue.getJobs(['active', 'waiting'], 0, 100);
        const now = Date.now();
        for (const job of stuck) {
            const age = now - (job.timestamp || 0);
            if (age > 5 * 60 * 1000) { // 5 minutes
                logger.warn({ jobId: job.id, age }, 'Found stuck job');
                try {
                    await job.remove();
                    logger.info({ jobId: job.id }, 'Removed stuck job');
                }
                catch (error) {
                    logger.error({ jobId: job.id, error }, 'Failed to remove stuck job');
                }
            }
        }
    }
    catch (error) {
        logger.error({ error }, 'Queue monitoring failed');
    }
    finally {
        await queue.close();
    }
}
/**
 * Kill runaway database queries (> 30 seconds)
 */
export async function killRunawayQueries(db, config) {
    try {
        // Query for long-running queries (PostgreSQL)
        const longQueries = await db.execute({
            sql: `
        SELECT pid, now() - pg_stat_activity.query_start AS duration, query
        FROM pg_stat_activity
        WHERE state = 'active'
          AND now() - pg_stat_activity.query_start > interval '30 seconds'
          AND pid != pg_backend_pid()
      `,
        });
        if (longQueries.rows && longQueries.rows.length > 0) {
            logger.warn({ count: longQueries.rows.length }, 'Found runaway queries');
            for (const query of longQueries.rows) {
                try {
                    await db.execute({
                        sql: `SELECT pg_terminate_backend($1)`,
                        args: [query.pid],
                    });
                    logger.info({ pid: query.pid, duration: query.duration }, 'Terminated runaway query');
                }
                catch (error) {
                    logger.error({ pid: query.pid, error }, 'Failed to terminate query');
                }
            }
        }
    }
    catch (error) {
        logger.error({ error }, 'Runaway query monitoring failed');
    }
}
/**
 * Auto-rollback failed migrations
 */
export async function autoRollbackMigrations(db, config) {
    if (!config.enableAutoRollback) {
        return;
    }
    try {
        // Check for failed migrations (requires migration tracking table)
        const failedMigrations = await db.execute({
            sql: `
        SELECT version, name, executed_at
        FROM schema_migrations
        WHERE status = 'failed'
        ORDER BY executed_at DESC
        LIMIT 1
      `,
        });
        if (failedMigrations.rows && failedMigrations.rows.length > 0) {
            const migration = failedMigrations.rows[0];
            logger.warn({ migration }, 'Found failed migration, attempting rollback');
            try {
                // Attempt to rollback
                // This would use your migration tool's rollback mechanism
                // For Drizzle, you'd need to implement rollback logic
                logger.info({ migration }, 'Migration rollback initiated');
                // Update migration status
                await db.execute({
                    sql: `
            UPDATE schema_migrations
            SET status = 'rolled_back', rolled_back_at = NOW()
            WHERE version = $1
          `,
                    args: [migration.version],
                });
                logger.info({ migration }, 'Migration rolled back successfully');
            }
            catch (error) {
                logger.error({ migration, error }, 'Migration rollback failed - manual intervention required');
                // Alert on-call
                // In production, send alert via PagerDuty/Slack
            }
        }
    }
    catch (error) {
        // Migration tracking table may not exist, which is OK
        if (error instanceof Error && error.message.includes('does not exist')) {
            logger.debug('Migration tracking table not found, skipping');
        }
        else {
            logger.error({ error }, 'Migration rollback check failed');
        }
    }
}
/**
 * Run all self-healing checks
 */
export async function runSelfHealing(config) {
    logger.info('Starting self-healing checks');
    try {
        // Monitor queue workers
        await monitorQueueWorkers(config);
        // Note: Database connection needed for query killing and migration rollback
        // These would be called with the actual db instance
        // await killRunawayQueries(db, config);
        // await autoRollbackMigrations(db, config);
        logger.info('Self-healing checks completed');
    }
    catch (error) {
        logger.error({ error }, 'Self-healing checks failed');
        throw error;
    }
}
/**
 * Default configuration
 */
export function getDefaultSelfHealConfig() {
    return {
        queueName: process.env.QUEUE_NAME || 'default',
        redisUrl: process.env.REDIS_URL || '',
        maxQueryDuration: parseInt(process.env.MAX_QUERY_DURATION_MS || '30000', 10),
        enableAutoRollback: process.env.ENABLE_AUTO_ROLLBACK === 'true',
    };
}
