/**
 * Experiment Infrastructure
 * Handles A/B testing, variant assignment, and conversion tracking
 */

import { analytics } from './analytics';
import { logger } from './logger';

export interface Experiment {
  id: string;
  name: string;
  variants: string[];
  active: boolean;
  startDate: string;
  endDate?: string;
  allocation?: number; // 0-1, percentage of traffic to include
}

export interface ExperimentAssignment {
  experimentId: string;
  variant: string;
  assignedAt: string;
}

export interface ConversionEvent {
  experimentId: string;
  variant: string;
  eventName: string;
  userId?: string;
  properties?: Record<string, unknown>;
}

// In-memory store (in production, use Redis/DB)
const experimentAssignments = new Map<string, ExperimentAssignment>();

// Active experiments configuration
export const EXPERIMENTS: Experiment[] = [
  {
    id: 'landing-hero-variant',
    name: 'Landing Page Hero Copy',
    variants: ['A', 'B', 'C'],
    active: true,
    startDate: new Date().toISOString(),
    allocation: 1.0, // 100% of traffic
  },
  {
    id: 'pantry-quick-start',
    name: 'Pantry Quick Start Feature',
    variants: ['control', 'treatment'],
    active: true,
    startDate: new Date().toISOString(),
    allocation: 0.5, // 50% of traffic
  },
];

/**
 * Assigns a variant to a user for an experiment
 * Uses consistent hashing to ensure same variant for same user
 */
export function assignVariant(
  experimentId: string,
  userId?: string
): string {
  const experiment = EXPERIMENTS.find((e) => e.id === experimentId);
  if (!experiment || !experiment.active) {
    return 'control'; // Default variant
  }

  // Check if user already assigned
  const key = userId || `anonymous_${getSessionId()}`;
  const existing = experimentAssignments.get(`${experimentId}_${key}`);
  if (existing) {
    return existing.variant;
  }

  // Consistent hash-based assignment
  const hash = hashString(`${experimentId}_${key}`);
  const variantIndex = Math.abs(hash) % experiment.variants.length;
  const variant = experiment.variants[variantIndex];

  // Store assignment
  experimentAssignments.set(`${experimentId}_${key}`, {
    experimentId,
    variant,
    assignedAt: new Date().toISOString(),
  });

  // Track assignment
  analytics.trackEvent('experiment_assigned', {
    experiment_id: experimentId,
    variant,
    user_id: userId,
    is_new_assignment: true,
  }).catch((err) => {
    logger.error('Failed to track experiment assignment', {
      error: err.message,
      experimentId,
      variant,
    }, 'system', 'experiments').catch(() => {});
  });

  return variant;
}

/**
 * Tracks a conversion event for an experiment
 */
export async function trackConversion(
  experimentId: string,
  eventName: string,
  userId?: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const key = userId || `anonymous_${getSessionId()}`;
  const assignment = experimentAssignments.get(`${experimentId}_${key}`);
  const variant = assignment?.variant || 'control';

  await analytics.trackEvent('experiment_conversion', {
    experiment_id: experimentId,
    variant,
    event_name: eventName,
    user_id: userId,
    ...properties,
  });

  await logger.info(
    'Experiment conversion tracked',
    {
      experimentId,
      variant,
      eventName,
      userId,
      properties,
    },
    'system',
    'experiments'
  );
}

/**
 * Gets the current variant for a user
 */
export function getVariant(experimentId: string, userId?: string): string {
  const key = userId || `anonymous_${getSessionId()}`;
  const assignment = experimentAssignments.get(`${experimentId}_${key}`);
  return assignment?.variant || 'control';
}

/**
 * Simple hash function for consistent assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

/**
 * Gets or creates a session ID (for anonymous users)
 */
function getSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }

  let sessionId = sessionStorage.getItem('experiment_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('experiment_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Checks if an experiment should be shown to this user
 */
export function shouldShowExperiment(
  experimentId: string,
  userId?: string
): boolean {
  const experiment = EXPERIMENTS.find((e) => e.id === experimentId);
  if (!experiment || !experiment.active) {
    return false;
  }

  // Check allocation percentage
  if (experiment.allocation && experiment.allocation < 1.0) {
    const key = userId || `anonymous_${getSessionId()}`;
    const hash = hashString(`${experimentId}_${key}`);
    const shouldInclude = Math.abs(hash) % 100 < experiment.allocation * 100;
    if (!shouldInclude) {
      return false;
    }
  }

  // Check date range
  const now = new Date();
  if (new Date(experiment.startDate) > now) {
    return false;
  }
  if (experiment.endDate && new Date(experiment.endDate) < now) {
    return false;
  }

  return true;
}
