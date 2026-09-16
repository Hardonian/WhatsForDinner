import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('conversion-funnel');

/**
 * Conversion Funnel Tracking
 * Tracks users through the conversion funnel
 */

export type FunnelStage = 
  | 'awareness'
  | 'interest'
  | 'consideration'
  | 'intent'
  | 'evaluation'
  | 'purchase'
  | 'post_purchase';

export interface FunnelEvent {
  stage: FunnelStage;
  action: string;
  metadata?: Record<string, unknown>;
}

/**
 * Track funnel progression
 */
export async function trackFunnelStage(
  stage: FunnelStage,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('/api/analytics/funnel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        stage,
        action,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });

    // Track in Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: 'funnel',
        event_label: stage,
        ...metadata,
      });
    }
  } catch (error) {
    _logger.error('Failed to track funnel stage:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Calculate funnel conversion rates
 */
export async function getFunnelMetrics(
  startDate: Date,
  endDate: Date
): Promise<Record<FunnelStage, number>> {
  try {
    const response = await fetch(
      `/api/analytics/funnel?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
    );
    const data = await response.json();
    return data.metrics;
  } catch (error) {
    _logger.error('Failed to get funnel metrics:', { error: error instanceof Error ? error.message : String(error) });
    return {} as Record<FunnelStage, number>;
  }
}

/**
 * Identify funnel drop-off points
 */
export function identifyDropOffs(
  funnelData: Record<FunnelStage, number>
): FunnelStage[] {
  const stages: FunnelStage[] = [
    'awareness',
    'interest',
    'consideration',
    'intent',
    'evaluation',
    'purchase',
  ];

  const dropOffs: FunnelStage[] = [];

  for (let i = 1; i < stages.length; i++) {
    const current = funnelData[stages[i]] || 0;
    const previous = funnelData[stages[i - 1]] || 0;

    if (previous > 0) {
      const dropOffRate = ((previous - current) / previous) * 100;
      if (dropOffRate > 50) {
        // More than 50% drop-off
        dropOffs.push(stages[i]);
      }
    }
  }

  return dropOffs;
}
