'use client';

/**
 * Phase 2: Performance & UX Stability
 * Enhanced Core Web Vitals tracking with budget enforcement
 */

import { useEffect } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { logger } from '@/lib/logger';

// Phase 2: Performance budgets from ARCHITECTURE_TARGET.md
const PERFORMANCE_BUDGETS = {
  LCP: { max: 2500, warning: 2000 },
  FID: { max: 100, warning: 80 },
  CLS: { max: 0.1, warning: 0.08 },
  FCP: { max: 1800, warning: 1500 },
  TTFB: { max: 800, warning: 600 },
  INP: { max: 200, warning: 150 },
};

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

function sendToAnalytics(metric: WebVitalsMetric) {
  const budget = PERFORMANCE_BUDGETS[metric.name as keyof typeof PERFORMANCE_BUDGETS];
  const isViolation = budget && metric.value > budget.max;
  const isWarning = budget && metric.value > budget.warning && metric.value <= budget.max;

  // Phase 2: Enhanced logging with budget information
  logger.info('Core Web Vital', {
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    budget: budget?.max,
    violation: isViolation,
    warning: isWarning,
  });

  // Phase 2: Send to analytics with budget context
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
      custom_parameter_1: budget?.max,
      custom_parameter_2: isViolation ? 'violation' : isWarning ? 'warning' : 'good',
    });
  }

  // Phase 2: Trigger alerts for budget violations
  if (isViolation && typeof window !== 'undefined') {
    // Dispatch custom event for performance dashboard
    window.dispatchEvent(
      new CustomEvent('performance-violation', {
        detail: {
          metric: metric.name,
          value: metric.value,
          budget: budget.max,
        },
      })
    );
  }
}

function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

// Phase 2: Store metrics in localStorage for analytics
function storeMetric(metric: WebVitalsMetric) {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem('web-vitals-history');
    const history = stored ? JSON.parse(stored) : [];
    history.push({
      ...metric,
      timestamp: Date.now(),
    });
    
    // Keep only last 100 metrics
    const trimmed = history.slice(-100);
    localStorage.setItem('web-vitals-history', JSON.stringify(trimmed));
  } catch (e) {
    // Silently fail if localStorage is not available
  }
}

export function CoreWebVitals() {
  useEffect(() => {
    // LCP - Largest Contentful Paint (Phase 2: Budget: < 2.5s)
    onLCP((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.LCP.warning, poor: PERFORMANCE_BUDGETS.LCP.max });
      const webVital: WebVitalsMetric = {
        name: 'LCP',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
      };
      storeMetric(webVital);
      sendToAnalytics(webVital);
    });

    // FID - First Input Delay (Phase 2: Budget: < 100ms)
    onFID((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.FID.warning, poor: PERFORMANCE_BUDGETS.FID.max });
      const webVital: WebVitalsMetric = {
        name: 'FID',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
      };
      storeMetric(webVital);
      sendToAnalytics(webVital);
    });

    // CLS - Cumulative Layout Shift (Phase 2: Budget: < 0.1)
    onCLS((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.CLS.warning, poor: PERFORMANCE_BUDGETS.CLS.max });
      const webVital: WebVitalsMetric = {
        name: 'CLS',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
      };
      storeMetric(webVital);
      sendToAnalytics(webVital);
    });

    // FCP - First Contentful Paint (Phase 2: Budget: < 1.8s)
    onFCP((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.FCP.warning, poor: PERFORMANCE_BUDGETS.FCP.max });
      const webVital: WebVitalsMetric = {
        name: 'FCP',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
      };
      storeMetric(webVital);
      sendToAnalytics(webVital);
    });

    // TTFB - Time to First Byte (Phase 2: Budget: < 800ms)
    onTTFB((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.TTFB.warning, poor: PERFORMANCE_BUDGETS.TTFB.max });
      const webVital: WebVitalsMetric = {
        name: 'TTFB',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
      };
      storeMetric(webVital);
      sendToAnalytics(webVital);
    });

    // INP - Interaction to Next Paint (Phase 2: Budget: < 200ms)
    if (onINP) {
      onINP((metric: Metric) => {
        const thresholds = PERFORMANCE_BUDGETS.INP || { max: 200, warning: 150 };
        const rating = getRating(metric.value, { good: thresholds.warning, poor: thresholds.max });
        const webVital: WebVitalsMetric = {
          name: 'INP',
          value: metric.value,
          rating,
          delta: metric.delta,
          id: metric.id,
        };
        storeMetric(webVital);
        sendToAnalytics(webVital);
      });
    }
  }, []);

  return null;
}

export default CoreWebVitals;
