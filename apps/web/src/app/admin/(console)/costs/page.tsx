'use client';
/**
 * Admin Cost Dashboard
 * 
 * Displays infrastructure costs:
 * - Cloud API costs (Supabase, Vercel, etc.)
 * - Stripe fees
 * - Email service costs
 * - Advertising costs
 * - Total costs and trends
 * - Budget alerts
 */


import { useEffect, useState } from 'react';

interface CostData {
  period: string;
  total: number;
  breakdown: {
    cloud: number;
    stripe: number;
    email: number;
    ads: number;
    other: number;
  };
  forecast: number;
  budget: number;
  budgetAlert: boolean;
  trend: 'up' | 'down' | 'stable';
}

interface CostMetrics {
  current: CostData;
  history: Array<{
    period: string;
    total: number;
  }>;
  trends: {
    monthOverMonth: number;
    yearOverYear: number;
  };
}

export default function AdminCostsPage() {
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    fetch(`/api/admin/costs?period=${period}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setMetrics(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [period]);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Cost Dashboard</h1>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Cost Dashboard</h1>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const { current } = metrics;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Cost Dashboard</h1>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded ${
                period === p ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Budget Alert */}
      {current.budgetAlert && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Budget Alert:</strong> Current spending ({formatCurrency(current.total)}) is{' '}
                {((current.total / current.budget) * 100).toFixed(1)}% of budget ({formatCurrency(current.budget)}).
                Forecast suggests{' '}
                {current.forecast > current.budget ? 'exceeding' : 'staying within'} budget.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Total Cost Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <CostCard
          title="Total Cost"
          value={current.total}
          subtitle={`Forecast: ${formatCurrency(current.forecast)}`}
          trend={current.trend}
          trendValue={metrics.trends.monthOverMonth}
        />
        <CostCard
          title="Budget"
          value={current.budget}
          subtitle={`Used: ${((current.total / current.budget) * 100).toFixed(1)}%`}
        />
        <CostCard
          title="Monthly Trend"
          value={metrics.trends.monthOverMonth}
          subtitle="vs last month"
          isPercentage={true}
        />
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Cost Breakdown</h2>
        <div className="space-y-4">
          <CostBreakdownItem
            label="Cloud Services"
            value={current.breakdown.cloud}
            total={current.total}
            color="blue"
          />
          <CostBreakdownItem
            label="Stripe Fees"
            value={current.breakdown.stripe}
            total={current.total}
            color="green"
          />
          <CostBreakdownItem
            label="Email Services"
            value={current.breakdown.email}
            total={current.total}
            color="yellow"
          />
          <CostBreakdownItem
            label="Advertising"
            value={current.breakdown.ads}
            total={current.total}
            color="purple"
          />
          <CostBreakdownItem
            label="Other"
            value={current.breakdown.other}
            total={current.total}
            color="gray"
          />
        </div>
      </div>

      {/* Cost History Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Cost History</h2>
        <div className="h-64 flex items-end justify-between gap-2">
          {metrics.history.map((point, index) => {
            const maxValue = Math.max(...metrics.history.map((p) => p.total));
            const height = (point.total / maxValue) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-500 rounded-t transition-all"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                  title={`${point.period}: ${formatCurrency(point.total)}`}
                />
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                  {point.period}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CostCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  isPercentage = false,
}: {
  title: string;
  value: number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  isPercentage?: boolean;
}) {
  const trendColor =
    trend === 'up' ? 'text-red-600' : trend === 'down' ? 'text-green-600' : 'text-gray-600';
  const trendIcon = trend === 'up' ? '?' : trend === 'down' ? '?' : '?';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold">{isPercentage ? `${value.toFixed(1)}%` : formatCurrency(value)}</p>
      {subtitle && <p className="text-gray-500 text-sm mt-2">{subtitle}</p>}
      {trend && trendValue !== undefined && (
        <p className={`text-sm mt-2 ${trendColor}`}>
          {trendIcon} {Math.abs(trendValue).toFixed(1)}%
        </p>
      )}
    </div>
  );
}

function CostBreakdownItem({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'gray';
}) {
  const percentage = (value / total) * 100;
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500',
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{formatCurrency(value)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${colorClasses[color]} h-2 rounded-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total</div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}
