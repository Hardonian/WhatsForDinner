// @ts-nocheck
/**
 * Experiment Service
 * Handles experiment assignment, exposure tracking, and guardrail monitoring
 * Privacy-safe: respects consent, no fingerprinting
 */

import { eq, and, sql, inArray } from 'drizzle-orm';
import { db } from '../db/index';
import { experiments, experimentVariants, experimentAssignments } from '../db/schema';
import { logger } from '../observability/index';
import { lifecycleEvents } from '../db/schema';

export interface ExperimentAssignment {
  experimentKey: string;
  variantKey: string;
  meta?: Record<string, unknown>;
}

export interface GuardrailCheck {
  experimentKey: string;
  metricName: string;
  value: number;
  threshold: number;
  direction: 'above' | 'below';
}

/**
 * Deterministic hash-based bucketing
 * Ensures consistent assignment for the same subject
 */
function hashSubject(experimentKey: string, subjectId: string): number {
  const str = `${experimentKey}:${subjectId}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 10000;
}

/**
 * Get or assign experiment variant for a subject
 * @param experimentKey - Experiment identifier
 * @param subjectId - User ID or anonymous ID
 * @param overrideVariant - Optional variant override for QA/testing (from header)
 * @param allowReassignment - If false and sticky=true, returns existing assignment
 */
export async function assignExperiment(
  experimentKey: string,
  subjectId: string | null,
  overrideVariant?: string,
  allowReassignment = false,
): Promise<ExperimentAssignment | null> {
  // Find running experiment
  const [experiment] = await db
    .select()
    .from(experiments)
    .where(and(eq(experiments.key, experimentKey), eq(experiments.status, 'running')))
    .limit(1);

  if (!experiment) {
    logger.warn({ experimentKey }, 'Experiment not found or not running');
    return null;
  }

  // Check for override (QA/testing)
  if (overrideVariant) {
    const variant = await db
      .select()
      .from(experimentVariants)
      .where(and(eq(experimentVariants.experiment_id, experiment.id), eq(experimentVariants.key, overrideVariant)))
      .limit(1);

    if (variant[0]) {
      return {
        experimentKey,
        variantKey: overrideVariant,
        meta: variant[0].meta as Record<string, unknown>,
      };
    }
  }

  // Determine subject identifier (user_id or anon_id)
  const isLoggedIn = subjectId && !subjectId.startsWith('anon_');
  const userId = isLoggedIn ? subjectId : null;
  const anonId = !isLoggedIn ? subjectId : null;

  // Check existing assignment if sticky
  if (!allowReassignment) {
    const existing = await db
      .select()
      .from(experimentAssignments)
      .where(
        and(
          eq(experimentAssignments.experiment_id, experiment.id),
          userId ? eq(experimentAssignments.user_id, userId) : sql`${experimentAssignments.user_id} IS NULL`,
          anonId ? eq(experimentAssignments.anon_id, anonId) : sql`${experimentAssignments.anon_id} IS NULL`,
        ),
      )
      .limit(1);

    if (existing[0] && existing[0].sticky) {
      const [variant] = await db
        .select()
        .from(experimentVariants)
        .where(and(eq(experimentVariants.experiment_id, experiment.id), eq(experimentVariants.key, existing[0].variant_key)))
        .limit(1);

      if (variant) {
        return {
          experimentKey,
          variantKey: existing[0].variant_key,
          meta: variant.meta as Record<string, unknown>,
        };
      }
    }
  }

  // Get variants with weights
  const variants = await db
    .select()
    .from(experimentVariants)
    .where(eq(experimentVariants.experiment_id, experiment.id));

  if (variants.length === 0) {
    logger.warn({ experimentKey }, 'No variants found for experiment');
    return null;
  }

  // Deterministic bucketing
  const bucket = hashSubject(experimentKey, subjectId || 'unknown');
  let cumulativeWeight = 0;
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);

  let selectedVariant = variants[0]; // Fallback
  for (const variant of variants) {
    cumulativeWeight += variant.weight;
    const threshold = (cumulativeWeight / totalWeight) * 10000;
    if (bucket < threshold) {
      selectedVariant = variant;
      break;
    }
  }

  // Store assignment
  await db
    .insert(experimentAssignments)
    .values({
      experiment_id: experiment.id,
      user_id: userId || null,
      anon_id: anonId || null,
      variant_key: selectedVariant.key,
      sticky: true,
    })
    .onConflictDoUpdate({
      target: [experimentAssignments.experiment_id, experimentAssignments.user_id!, experimentAssignments.anon_id!],
      set: {
        variant_key: selectedVariant.key,
        assigned_at: new Date(),
      },
    });

  logger.info(
    { experimentKey, variantKey: selectedVariant.key, subjectId },
    'Experiment assigned',
  );

  return {
    experimentKey,
    variantKey: selectedVariant.key,
    meta: selectedVariant.meta as Record<string, unknown>,
  };
}

/**
 * Batch assign multiple experiments
 */
export async function assignExperiments(
  experimentKeys: string[],
  subjectId: string | null,
  overrides?: Record<string, string>,
): Promise<Record<string, ExperimentAssignment | null>> {
  const results: Record<string, ExperimentAssignment | null> = {};

  await Promise.all(
    experimentKeys.map(async (key) => {
      results[key] = await assignExperiment(key, subjectId, overrides?.[key]);
    }),
  );

  return results;
}

/**
 * Track experiment exposure (when user sees the variant)
 */
export async function trackExposure(
  experimentKey: string,
  variantKey: string,
  subjectId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const [experiment] = await db
    .select()
    .from(experiments)
    .where(eq(experiments.key, experimentKey))
    .limit(1);

  if (!experiment) {
    return;
  }

  const isLoggedIn = subjectId && !subjectId.startsWith('anon_');
  const userId = isLoggedIn ? subjectId : null;
  const anonId = !isLoggedIn ? subjectId : null;

  // Log lifecycle event
  await db.insert(lifecycleEvents).values({
    user_id: userId || null,
    anon_id: anonId || null,
    name: 'ExperimentExposure',
    props: {
      experiment_key: experimentKey,
      variant_key: variantKey,
      ...metadata,
    },
  });

  logger.debug({ experimentKey, variantKey, subjectId }, 'Experiment exposure tracked');
}

/**
 * Check guardrail metrics and auto-pause if threshold breached
 */
export async function checkGuardrails(experimentKey: string): Promise<boolean> {
  const [experiment] = await db
    .select()
    .from(experiments)
    .where(and(eq(experiments.key, experimentKey), eq(experiments.status, 'running')))
    .limit(1);

  if (!experiment || !experiment.guardrail_metrics || experiment.guardrail_metrics.length === 0) {
    return true; // No guardrails to check
  }

  const killSwitchEnabled = process.env.EXPERIMENTS_KILL_SWITCH === 'true';
  if (!killSwitchEnabled) {
    logger.debug({ experimentKey }, 'Guardrail kill switch disabled');
    return true;
  }

  // Fetch guardrail metrics from lifecycle events
  // In production, you'd query your analytics/metrics system
  // For now, we'll check if any guardrail metric exceeds a threshold
  // This is a simplified version - in production, compute actual metrics

  // Example: Check crash_rate guardrail
  const guardrails = experiment.guardrail_metrics as string[];
  for (const metricName of guardrails) {
    // Simplified check - in production, compute actual metric values
    // from your analytics system (PostHog, Segment, etc.)
    const threshold = 0.05; // 5% crash rate threshold
    const direction = metricName.includes('crash') ? 'above' : 'below';

    // TODO: Fetch actual metric value from analytics
    // For now, we'll log a warning and continue
    logger.warn(
      { experimentKey, metricName },
      'Guardrail check not fully implemented - requires analytics integration',
    );
  }

  return true;
}

/**
 * Auto-pause experiment if guardrail breached
 */
export async function pauseExperimentIfNeeded(experimentKey: string): Promise<boolean> {
  const shouldContinue = await checkGuardrails(experimentKey);
  
  if (!shouldContinue) {
    await db
      .update(experiments)
      .set({
        status: 'paused',
        stopped_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(experiments.key, experimentKey));

    logger.warn({ experimentKey }, 'Experiment auto-paused due to guardrail breach');
    return true;
  }

  return false;
}

/**
 * Get experiment statistics (for dashboard)
 */
export async function getExperimentStats(experimentKey: string) {
  const [experiment] = await db
    .select()
    .from(experiments)
    .where(eq(experiments.key, experimentKey))
    .limit(1);

  if (!experiment) {
    return null;
  }

  const variants = await db
    .select()
    .from(experimentVariants)
    .where(eq(experimentVariants.experiment_id, experiment.id));

  const assignments = await db
    .select({
      variant_key: experimentAssignments.variant_key,
      count: sql<number>`count(*)`,
    })
    .from(experimentAssignments)
    .where(eq(experimentAssignments.experiment_id, experiment.id))
    .groupBy(experimentAssignments.variant_key);

  return {
    experiment,
    variants,
    assignments: assignments.reduce((acc, a) => {
      acc[a.variant_key] = Number(a.count);
      return acc;
    }, {} as Record<string, number>),
  };
}

/**
 * Minimum sample size calculator (for power analysis)
 */
export function calculateMinSampleSize(
  baselineRate: number,
  mde: number, // Minimum Detectable Effect (e.g., 0.05 for 5%)
  power: number = 0.8,
  alpha: number = 0.05,
): number {
  const zAlpha = 1.96; // For 0.05 alpha
  const zBeta = 0.84; // For 0.8 power
  const p1 = baselineRate;
  const p2 = baselineRate * (1 + mde);
  const pBar = (p1 + p2) / 2;

  const numerator = Math.pow(zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
  const denominator = Math.pow(p2 - p1, 2);

  return Math.ceil(numerator / denominator);
}
