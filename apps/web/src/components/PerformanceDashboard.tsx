'use client';

/**
 * Phase 2: Performance & UX Stability
 * Real-time Performance Monitoring Dashboard
 * 
 * Provides real-time metrics visualization and performance budget tracking
 */

import React, { useEffect, useState, useCallback } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { Card } from '@/components/ui/card';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  timestamp: number;
}

interface PerformanceBudget {
  LCP: { max: number; warning: number };
  FID: { max: number; warning: number };
  CLS: { max: number; warning: number };
  FCP: { max: number; warning: number };
  TTFB: { max: number; warning: number };
  INP?: { max: number; warning: number };
}

const PERFORMANCE_BUDGETS: PerformanceBudget = {
  LCP: { max: 2500, warning: 2000 },
  FID: { max: 100, warning: 80 },
  CLS: { max: 0.1, warning: 0.08 },
  FCP: { max: 1800, warning: 1500 },
  TTFB: { max: 800, warning: 600 },
  INP: { max: 200, warning: 150 },
};

function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

function formatValue(value: number, metric: string): string {
  if (metric === 'CLS') return value.toFixed(3);
  return `${Math.round(value)}ms`;
}

function getStatusColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'needs-improvement':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'poor':
      return 'text-red-600 bg-red-50 border-red-200';
  }
}

interface PerformanceDashboardProps {
  showOnly?: boolean; // If true, only show when metrics are available
  compact?: boolean;
}

export function PerformanceDashboard({ showOnly = false, compact = false }: PerformanceDashboardProps) {
  const [metrics, setMetrics] = useState<Record<string, PerformanceMetric>>({});
  const [isVisible, setIsVisible] = useState(!showOnly);

  const updateMetric = useCallback((metric: PerformanceMetric) => {
    setMetrics((prev) => ({
      ...prev,
      [metric.name]: metric,
    }));
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // LCP - Largest Contentful Paint
    onLCP((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.LCP.warning, poor: PERFORMANCE_BUDGETS.LCP.max });
      updateMetric({
        name: 'LCP',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
      });
    });

    // FID - First Input Delay
    onFID((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.FID.warning, poor: PERFORMANCE_BUDGETS.FID.max });
      updateMetric({
        name: 'FID',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
      });
    });

    // CLS - Cumulative Layout Shift
    onCLS((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.CLS.warning, poor: PERFORMANCE_BUDGETS.CLS.max });
      updateMetric({
        name: 'CLS',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
      });
    });

    // FCP - First Contentful Paint
    onFCP((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.FCP.warning, poor: PERFORMANCE_BUDGETS.FCP.max });
      updateMetric({
        name: 'FCP',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
      });
    });

    // TTFB - Time to First Byte
    onTTFB((metric: Metric) => {
      const rating = getRating(metric.value, { good: PERFORMANCE_BUDGETS.TTFB.warning, poor: PERFORMANCE_BUDGETS.TTFB.max });
      updateMetric({
        name: 'TTFB',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
      });
    });

    // INP - Interaction to Next Paint
    if (onINP) {
      onINP((metric: Metric) => {
        const thresholds = PERFORMANCE_BUDGETS.INP || { max: 200, warning: 150 };
        const rating = getRating(metric.value, { good: thresholds.warning, poor: thresholds.max });
      updateMetric({
        name: 'INP',
        value: metric.value,
        rating,
        delta: metric.delta,
        id: metric.id,
        timestamp: Date.now(),
      });
    });
    }
  }, [updateMetric]);

  if (!isVisible || Object.keys(metrics).length === 0) {
    return null;
  }

  const metricEntries = Object.entries(metrics);
  const allGood = metricEntries.every(([_, m]) => m.rating === 'good');
  const hasIssues = metricEntries.some(([_, m]) => m.rating === 'poor');

  if (compact) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className={`p-3 shadow-lg ${hasIssues ? 'border-red-200' : allGood ? 'border-green-200' : 'border-yellow-200'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${hasIssues ? 'bg-red-500' : allGood ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-xs font-medium">
              {metricEntries.length} metrics {hasIssues ? '??' : allGood ? '?' : '?'}
            </span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="p-4 shadow-xl border-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground">Performance Metrics</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-muted-foreground hover:text-foreground text-xs"
            aria-label="Close dashboard"
          >
            ?
          </button>
        </div>
        <div className="space-y-2">
          {metricEntries.map(([name, metric]) => {
            const budget = PERFORMANCE_BUDGETS[name as keyof PerformanceBudget];
            const budgetMax = budget?.max || 0;
            const percentage = Math.min((metric.value / budgetMax) * 100, 100);
            
            return (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{name}</span>
                  <span className={getStatusColor(metric.rating).split(' ')[0]}>
                    {formatValue(metric.value, name)}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      metric.rating === 'good'
                        ? 'bg-green-500'
                        : metric.rating === 'needs-improvement'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Budget: {formatValue(budgetMax, name)}</span>
                  <span className={metric.rating === 'poor' ? 'text-red-600' : ''}>
                    {metric.rating === 'good' ? '?' : metric.rating === 'poor' ? '?' : '??'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        {hasIssues && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-red-600">
              ?? Some metrics exceed performance budgets
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default PerformanceDashboard;
