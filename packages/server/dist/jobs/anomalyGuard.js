// @ts-nocheck
/**
 * Anomaly Guard Job
 * Monitors metrics and auto-pauses experiments if guardrails breached
 */
import { db } from '../db/index';
import { experiments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../observability/index';
import { pauseExperimentIfNeeded } from '../experiments/service';
import { lifecycleEvents } from '../db/schema';
export async function anomalyGuardProcessor() {
    logger.info('Starting anomaly guard job');
    const results = { checked: 0, paused: 0, errors: 0 };
    try {
        // Get all running experiments
        const runningExperiments = await db
            .select()
            .from(experiments)
            .where(eq(experiments.status, 'running'));
        for (const experiment of runningExperiments) {
            try {
                results.checked++;
                // Check guardrails
                const wasPaused = await pauseExperimentIfNeeded(experiment.key);
                if (wasPaused) {
                    results.paused++;
                    // Log lifecycle event
                    await db.insert(lifecycleEvents).values({
                        name: 'ExperimentAutoPaused',
                        props: {
                            experiment_key: experiment.key,
                            reason: 'guardrail_breach',
                        },
                    });
                    logger.warn({ experimentKey: experiment.key }, 'Experiment auto-paused by guardrail');
                }
            }
            catch (error) {
                results.errors++;
                logger.error({ error, experimentKey: experiment.key }, 'Error checking experiment guardrails');
            }
        }
    }
    catch (error) {
        logger.error({ error }, 'Error in anomaly guard');
        results.errors++;
    }
    logger.info({ checked: results.checked, paused: results.paused, errors: results.errors }, 'Anomaly guard completed');
    return results;
}
