import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('ab-testing');

/**
 * A/B Testing Utilities
 * For testing different variations of program pages and CTAs
 */

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number; // 0-100
}

export interface ABTest {
  id: string;
  name: string;
  variants: ABTestVariant[];
  active: boolean;
}

/**
 * Get user's assigned variant for a test
 */
export function getVariant(testId: string, userId?: string): string {
  // Use consistent hashing based on user ID or session
  const seed = userId || getSessionId();
  const hash = hashString(seed + testId);
  
  // Get test configuration
  const test = getTestConfig(testId);
  if (!test || !test.active) {
    return 'control';
  }

  // Assign variant based on hash
  let cumulative = 0;
  for (const variant of test.variants) {
    cumulative += variant.weight;
    if (hash % 100 < cumulative) {
      return variant.id;
    }
  }

  return 'control';
}

/**
 * Track conversion for A/B test
 */
export async function trackConversion(
  testId: string,
  variant: string,
  conversionType: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test_id: testId,
        variant,
        conversion_type: conversionType,
        metadata,
      }),
    });
  } catch (error) {
    _logger.error('Failed to track A/B test conversion:', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Get test configuration
 */
function getTestConfig(testId: string): ABTest | null {
  // In production, fetch from database or config
  const tests: Record<string, ABTest> = {
    'referral-cta': {
      id: 'referral-cta',
      name: 'Referral CTA Button',
      variants: [
        { id: 'default', name: 'Default', weight: 50 },
        { id: 'urgent', name: 'Urgent', weight: 50 },
      ],
      active: true,
    },
    'affiliate-commission': {
      id: 'affiliate-commission',
      name: 'Commission Display',
      variants: [
        { id: 'percentage', name: 'Percentage', weight: 50 },
        { id: 'dollar', name: 'Dollar Amount', weight: 50 },
      ],
      active: true,
    },
  };

  return tests[testId] || null;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random()}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
