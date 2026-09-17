'use client';


/**
 * Performance Dashboard
 * 
 * Shows API response times, suggestion generation time, Core Web Vitals
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Gauge,
  Clock,
  Zap,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface PerformanceMetrics {
  apiResponseTime: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  suggestionGenerationTime: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
  };
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/performance');
        if (!response.ok) {
          throw new Error('Failed to fetch performance metrics');
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'No data available'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatMs = (ms: number) => `${Math.round(ms)}ms`;
  const isHealthy = (value: number, threshold: number) => value <= threshold;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            API response times, suggestion generation, and Core Web Vitals
          </p>
        </div>

        {/* API Response Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <CardTitle>API Response Time</CardTitle>
            </div>
            <CardDescription>Response times for API endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Average</div>
                <div className="text-2xl font-bold">
                  {formatMs(metrics.apiResponseTime.average)}
                </div>
                <Badge
                  variant={isHealthy(metrics.apiResponseTime.average, 500) ? 'default' : 'destructive'}
                  className="mt-2"
                >
                  {isHealthy(metrics.apiResponseTime.average, 500) ? 'Healthy' : 'Slow'}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">P50</div>
                <div className="text-2xl font-bold">
                  {formatMs(metrics.apiResponseTime.p50)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">P95</div>
                <div className="text-2xl font-bold">
                  {formatMs(metrics.apiResponseTime.p95)}
                </div>
                <Badge
                  variant={isHealthy(metrics.apiResponseTime.p95, 1000) ? 'default' : 'destructive'}
                  className="mt-2"
                >
                  {isHealthy(metrics.apiResponseTime.p95, 1000) ? 'OK' : 'Needs Attention'}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">P99</div>
                <div className="text-2xl font-bold">
                  {formatMs(metrics.apiResponseTime.p99)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggestion Generation Time */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Suggestion Generation Time</CardTitle>
            </div>
            <CardDescription>Time to generate meal suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Average</div>
                <div className="text-2xl font-bold">
                  {formatMs(metrics.suggestionGenerationTime.average)}
                </div>
                <Badge
                  variant={isHealthy(metrics.suggestionGenerationTime.average, 30000) ? 'default' : 'destructive'}
                  className="mt-2"
                >
                  {isHealthy(metrics.suggestionGenerationTime.average, 30000) ? 'Fast' : 'Slow'}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">P50</div>
                <div className="text-2xl font-bold">
                  {formatMs(metrics.suggestionGenerationTime.p50)}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">P95</div>
                <div className="text-2xl font-bold">
                  {formatMs(metrics.suggestionGenerationTime.p95)}
                </div>
                <Badge
                  variant={isHealthy(metrics.suggestionGenerationTime.p95, 30000) ? 'default' : 'destructive'}
                  className="mt-2"
                >
                  {isHealthy(metrics.suggestionGenerationTime.p95, 30000) ? 'On Target' : 'Above Target'}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">P99</div>
                <div className="text-2xl font-bold">
                  {formatMs(metrics.suggestionGenerationTime.p99)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Core Web Vitals */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              <CardTitle>Core Web Vitals</CardTitle>
            </div>
            <CardDescription>User experience metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="text-sm text-muted-foreground mb-1">LCP (Largest Contentful Paint)</div>
                <div className="text-2xl font-bold">
                  {metrics.coreWebVitals.lcp > 0
                    ? `${(metrics.coreWebVitals.lcp / 1000).toFixed(2)}s`
                    : 'N/A'}
                </div>
                <Badge
                  variant={metrics.coreWebVitals.lcp > 0 && isHealthy(metrics.coreWebVitals.lcp, 2500) ? 'default' : 'secondary'}
                  className="mt-2"
                >
                  {metrics.coreWebVitals.lcp === 0
                    ? 'Not Tracked'
                    : isHealthy(metrics.coreWebVitals.lcp, 2500)
                    ? 'Good'
                    : 'Needs Improvement'}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">FID (First Input Delay)</div>
                <div className="text-2xl font-bold">
                  {metrics.coreWebVitals.fid > 0
                    ? `${metrics.coreWebVitals.fid}ms`
                    : 'N/A'}
                </div>
                <Badge
                  variant={metrics.coreWebVitals.fid > 0 && isHealthy(metrics.coreWebVitals.fid, 100) ? 'default' : 'secondary'}
                  className="mt-2"
                >
                  {metrics.coreWebVitals.fid === 0
                    ? 'Not Tracked'
                    : isHealthy(metrics.coreWebVitals.fid, 100)
                    ? 'Good'
                    : 'Needs Improvement'}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">CLS (Cumulative Layout Shift)</div>
                <div className="text-2xl font-bold">
                  {metrics.coreWebVitals.cls > 0
                    ? metrics.coreWebVitals.cls.toFixed(3)
                    : 'N/A'}
                </div>
                <Badge
                  variant={metrics.coreWebVitals.cls > 0 && isHealthy(metrics.coreWebVitals.cls, 0.1) ? 'default' : 'secondary'}
                  className="mt-2"
                >
                  {metrics.coreWebVitals.cls === 0
                    ? 'Not Tracked'
                    : isHealthy(metrics.coreWebVitals.cls, 0.1)
                    ? 'Good'
                    : 'Needs Improvement'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Targets Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Performance Targets</CardTitle>
            </div>
            <CardDescription>Current status vs. sprint targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isHealthy(metrics.suggestionGenerationTime.p95, 30000) ? (
                    <div className="w-5 h-5 rounded-full bg-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span>Suggestion Generation &lt; 30s (P95)</span>
                </div>
                <Badge variant={isHealthy(metrics.suggestionGenerationTime.p95, 30000) ? 'default' : 'destructive'}>
                  {formatMs(metrics.suggestionGenerationTime.p95)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isHealthy(metrics.apiResponseTime.p95, 500) ? (
                    <div className="w-5 h-5 rounded-full bg-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <span>API Response &lt; 500ms (P95)</span>
                </div>
                <Badge variant={isHealthy(metrics.apiResponseTime.p95, 500) ? 'default' : 'destructive'}>
                  {formatMs(metrics.apiResponseTime.p95)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}