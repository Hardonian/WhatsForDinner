'use client';

export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

interface YCMetrics {
  activeUsers: Array<{
    date: string;
    dau: number;
    wau: number;
    mau: number;
  }>;
  activation: {
    total_signups: number;
    activated_users: number;
    activation_rate: number;
  } | null;
  retention: {
    cohort_date: string;
    signups: number;
    retained: number;
    retention_rate: number;
  } | null;
  funnel: {
    visitors: number;
    signups: number;
    signup_rate: number;
    activated: number;
    activation_rate: number;
    engaged: number;
    engagement_rate: number;
    paying: number;
    conversion_rate: number;
  } | null;
  revenue: {
    mrr: number;
    paying_users: number;
    arpu: number;
  } | null;
  unitEconomics: {
    total_revenue: number;
    total_costs: number;
    gross_profit: number;
    gross_margin_pct: number;
    avg_ltv: number;
    avg_months_active: number;
  } | null;
  channels: Array<{
    channel: string;
    signups: number;
    activated: number;
    paying: number;
    activation_rate: number;
    conversion_rate: number;
  }>;
  timestamp: string;
}

export default function YCMetricsPage() {
  const [data, setData] = useState<YCMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch('/api/metrics/yc');
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics');
        console.error('Metrics fetch error:', err);
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
        <h1 className="text-3xl font-bold mb-6">YC Metrics Dashboard</h1>
        <div className="text-gray-500">Loading metrics...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">YC Metrics Dashboard</h1>
        <div className="text-red-500">Error: {error || 'No data available'}</div>
        <div className="mt-4 text-sm text-gray-500">
          Note: Make sure you've run migration 016_metrics_calculations.sql
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">YC Metrics Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Key metrics for YC application and interview preparation
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date(data.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.activeUsers[0]?.dau || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Weekly Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.activeUsers[0]?.wau || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.activeUsers[0]?.mau || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Users Chart */}
      {data.activeUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Users Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.activeUsers.slice(0, 30)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="dau" stroke="#8884d8" name="DAU" />
                <Line type="monotone" dataKey="wau" stroke="#82ca9d" name="WAU" />
                <Line type="monotone" dataKey="mau" stroke="#ffc658" name="MAU" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Activation & Retention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.activation && (
          <Card>
            <CardHeader>
              <CardTitle>Activation Rate</CardTitle>
              <CardDescription>% of signups who generate first recipe within 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {data.activation.activation_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">
                {data.activation.activated_users} of {data.activation.total_signups} signups activated
              </div>
            </CardContent>
          </Card>
        )}

        {data.retention && (
          <Card>
            <CardHeader>
              <CardTitle>7-Day Retention</CardTitle>
              <CardDescription>Cohort: {data.retention.cohort_date}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                {data.retention.retention_rate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">
                {data.retention.retained} of {data.retention.signups} users retained
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Conversion Funnel */}
      {data.funnel && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <span className="font-medium">Visitors</span>
                <span className="text-2xl font-bold">{data.funnel.visitors.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded">
                <div>
                  <span className="font-medium">Signups</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({data.funnel.signup_rate.toFixed(1)}%)
                  </span>
                </div>
                <span className="text-2xl font-bold">{data.funnel.signups.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded">
                <div>
                  <span className="font-medium">Activated</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({data.funnel.activation_rate.toFixed(1)}%)
                  </span>
                </div>
                <span className="text-2xl font-bold">{data.funnel.activated.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded">
                <div>
                  <span className="font-medium">Engaged (3+ recipes)</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({data.funnel.engagement_rate.toFixed(1)}%)
                  </span>
                </div>
                <span className="text-2xl font-bold">{data.funnel.engaged.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded">
                <div>
                  <span className="font-medium">Paying</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({data.funnel.conversion_rate.toFixed(1)}%)
                  </span>
                </div>
                <span className="text-2xl font-bold">{data.funnel.paying.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Metrics */}
      {data.revenue && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${data.revenue.mrr.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Paying Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.revenue.paying_users.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">ARPU</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${data.revenue.arpu.toFixed(2)}/mo
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unit Economics */}
      {data.unitEconomics && (
        <Card>
          <CardHeader>
            <CardTitle>Unit Economics</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-500">Gross Margin</div>
                <div className="text-2xl font-bold">
                  {data.unitEconomics.gross_margin_pct.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg LTV</div>
                <div className="text-2xl font-bold">
                  ${data.unitEconomics.avg_ltv.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg Months Active</div>
                <div className="text-2xl font-bold">
                  {data.unitEconomics.avg_months_active.toFixed(1)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Total Costs</div>
                <div className="text-2xl font-bold">
                  ${data.unitEconomics.total_costs.toFixed(2)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Channel Metrics */}
      {data.channels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acquisition Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.channels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="channel" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="signups" fill="#8884d8" name="Signups" />
                <Bar dataKey="activated" fill="#82ca9d" name="Activated" />
                <Bar dataKey="paying" fill="#ffc658" name="Paying" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
