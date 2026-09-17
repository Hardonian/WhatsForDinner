'use client';
/**
 * Performance Intelligence Layer: Admin Metrics Dashboard
 * Visualizes performance metrics from all sources with Recharts
 */


import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  performance: {
    webVitals: {
      LCP: number;
      CLS: number;
      TTFB: number;
      FID: number;
    };
    supabase: {
      avgLatencyMs: number;
      queryCount: number;
    };
    expo: {
      bundleMB: number;
      buildDurationMin: number;
    };
    ci: {
      avgBuildMin: number;
      successRate: number;
    };
  };
  status: 'healthy' | 'degraded' | 'critical';
  lastUpdated: string;
  trends?: {
    recordCount?: {
      current: number;
      previous: number;
      change: number;
    };
  };
}

export default function MetricsDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics/dashboard');
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Performance Metrics</h1>
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Performance Metrics</h1>
        <div className="text-red-500">Error: {error || 'No data available'}</div>
      </div>
    );
  }

  const statusColor =
    data.status === 'healthy'
      ? 'text-green-600'
      : data.status === 'degraded'
      ? 'text-yellow-600'
      : 'text-red-600';

  // Prepare chart data
  const webVitalsData = [
    { name: 'LCP', value: data.performance.webVitals.LCP, threshold: 2.5 },
    { name: 'CLS', value: data.performance.webVitals.CLS, threshold: 0.1 },
    { name: 'TTFB', value: data.performance.webVitals.TTFB, threshold: 800 },
    { name: 'FID', value: data.performance.webVitals.FID, threshold: 100 },
  ];

  const sourceData = [
    {
      name: 'Supabase',
      latency: data.performance.supabase.avgLatencyMs,
      queries: data.performance.supabase.queryCount,
    },
    {
      name: 'Expo',
      bundle: data.performance.expo.bundleMB,
      duration: data.performance.expo.buildDurationMin,
    },
    {
      name: 'CI',
      buildTime: data.performance.ci.avgBuildMin,
      success: data.performance.ci.successRate,
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Performance Intelligence Dashboard</h1>
        <div className="text-sm text-gray-500">
          Status:{' '}
          <span className={`font-semibold ${statusColor}`}>
            {data.status.toUpperCase()}
          </span>
          <br />
          Last updated: {new Date(data.lastUpdated).toLocaleString()}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">LCP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.performance.webVitals.LCP.toFixed(2)}s
            </div>
            <div className="text-xs text-gray-500">
              {data.performance.webVitals.LCP > 2.5 ? '⚠️ Slow' : '✅ Good'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">CLS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.performance.webVitals.CLS.toFixed(3)}
            </div>
            <div className="text-xs text-gray-500">
              {data.performance.webVitals.CLS > 0.1 ? '⚠️ Poor' : '✅ Good'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Supabase Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.performance.supabase.avgLatencyMs.toFixed(0)}ms
            </div>
            <div className="text-xs text-gray-500">
              {data.performance.supabase.queryCount} queries
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">CI Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.performance.ci.successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">
              {data.performance.ci.avgBuildMin.toFixed(1)} min avg
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Web Vitals Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={webVitalsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Current Value" />
              <Bar dataKey="threshold" fill="#ffc658" name="Threshold" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Source Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Backend Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Avg Latency:</span>
                <span className="font-semibold">
                  {data.performance.supabase.avgLatencyMs.toFixed(0)}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span>Query Count:</span>
                <span className="font-semibold">
                  {data.performance.supabase.queryCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mobile Build Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Bundle Size:</span>
                <span className="font-semibold">
                  {data.performance.expo.bundleMB.toFixed(1)} MB
                </span>
              </div>
              <div className="flex justify-between">
                <span>Build Duration:</span>
                <span className="font-semibold">
                  {data.performance.expo.buildDurationMin.toFixed(1)} min
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends */}
      {data.trends?.recordCount && (
        <Card>
          <CardHeader>
            <CardTitle>Trends (7-day)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Current Records:</span>
                <span className="font-semibold">
                  {data.trends.recordCount.current}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span
                  className={`font-semibold ${
                    data.trends.recordCount.change > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {data.trends.recordCount.change > 0 ? '+' : ''}
                  {data.trends.recordCount.change.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
