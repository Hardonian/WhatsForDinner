import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('ab-test');

/**
 * A/B Testing Utilities
 * Provides A/B test management and variant assignment
 */

export interface ABTest {
  name: string;
  variants: string[];
  weights?: number[];
}

class ABTestManager {
  private tests: Map<string, ABTest> = new Map();
  private assignments: Map<string, string> = new Map();

  /**
   * Register an A/B test
   */
  register(test: ABTest): void {
    this.tests.set(test.name, test);
  }

  /**
   * Get variant for a test (deterministic based on userId or sessionId)
   */
  getVariant(testName: string, userId?: string, sessionId?: string): string {
    const test = this.tests.get(testName);
    if (!test) {
      _logger.warn('A/B test "${testName}" not found');
      return test?.variants[0] || 'control';
    }

    // Check if already assigned
    const key = `${testName}_${userId || sessionId || 'anonymous'}`;
    if (this.assignments.has(key)) {
      return this.assignments.get(key)!;
    }

    // Assign variant
    const variant = this.assignVariant(test, key);
    this.assignments.set(key, variant);

    // Persist assignment
    if (typeof window !== 'undefined') {
      localStorage.setItem(`ab_test_${testName}`, variant);
    }

    return variant;
  }

  private assignVariant(test: ABTest, key: string): string {
    const weights = test.weights || test.variants.map(() => 1 / test.variants.length);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    // Deterministic hash based on key
    const hash = this.hashString(key);
    const random = (hash % 10000) / 10000;
    
    let cumulative = 0;
    for (let i = 0; i < test.variants.length; i++) {
      cumulative += weights[i] / totalWeight;
      if (random < cumulative) {
        return test.variants[i];
      }
    }

    return test.variants[test.variants.length - 1];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Check if user is in variant
   */
  isVariant(testName: string, variant: string, userId?: string, sessionId?: string): boolean {
    return this.getVariant(testName, userId, sessionId) === variant;
  }

  /**
   * Get all assignments
   */
  getAssignments(): Record<string, string> {
    const result: Record<string, string> = {};
    this.assignments.forEach((variant, key) => {
      result[key] = variant;
    });
    return result;
  }
}

export const abTest = new ABTestManager();

// Example usage:
// abTest.register({
//   name: 'button_color',
//   variants: ['blue', 'green', 'red'],
//   weights: [0.33, 0.33, 0.34],
// });
//
// const variant = abTest.getVariant('button_color', userId);
// if (variant === 'blue') { ... }
