/**
 * Activation Dashboard Component
 * Displays activation metrics and recommendations for weekly reviews
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('activationdashboard');



import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ActivationMetrics {
  period: {
    days: number;
    start: string;
    end: string;
  };
  signups: number;
  activations: number;
  activationRate: number;
  avgTimeToActivation: number;
  dropoffPoints: Array<{ stage: string; count: number; percentage: number }>;
  abTestResults: Record<string, Record<string, { assigned: number; activated: number; rate: number }>>;
}

export function ActivationDashboard() {
  const [metrics, setMetrics] = useState<ActivationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);

  useEffect(() => {
    fetch(`/api/activation/review?days=${days}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMetrics(data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        _logger.error('Failed to load activation metrics:', { err });
        setLoading(false);
      });
  }, [days]);

  if (loading) {
    return <div className="p-6">Loading activation metrics...</div>;
  }

  if (!metrics) {
    return <div className="p-6 text-red-600">Failed to load activation metrics</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Activation Dashboard</h1>
        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="px-4 py-2 border rounded"
        >
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.signups}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Activations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.activations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Activation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.activationRate.toFixed(1)}%</div>
            {metrics.activationRate < 50 && (
              <p className="text-sm text-yellow-600 mt-2">⚠️ Below target (50%)</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Avg Time to Activation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.avgTimeToActivation.toFixed(1)}m</div>
            {metrics.avgTimeToActivation > 40 && (
              <p className="text-sm text-yellow-600 mt-2">⚠️ Target: &lt;2 minutes</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel Dropoff Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.dropoffPoints.slice(0, 5).map((point, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-medium">{point.stage}</span>
                <div className="flex items-center gap-4">
                  <div className="w-48 bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{ width: `${point.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-24 text-right">
                    {point.percentage.toFixed(1)}% ({point.count})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {Object.keys(metrics.abTestResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>A/B Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.abTestResults).map(([test, variants]) => (
                <div key={test} className="border-b pb-4 last:border-0">
                  <h3 className="font-semibold mb-2">{test}</h3>
                  <div className="space-y-2">
                    {Object.entries(variants).map(([variant, data]) => (
                      <div key={variant} className="flex items-center justify-between">
                        <span>{variant}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            {data.activated}/{data.assigned} activated
                          </span>
                          <span className="font-medium">{data.rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2">
            {metrics.activationRate < 50 && (
              <li>⚠️ Activation rate is below 50%. Focus on onboarding improvements.</li>
            )}
            {metrics.avgTimeToActivation > 40 && (
              <li>⏱️ Average time to activation is {metrics.avgTimeToActivation.toFixed(1)} minutes. Target: &lt;2 minutes.</li>
            )}
            {metrics.dropoffPoints[0] && metrics.dropoffPoints[0].percentage < 80 && (
              <li>
                📉 Biggest dropoff at &quot;{metrics.dropoffPoints[0].stage}&quot; stage (
                {metrics.dropoffPoints[0].percentage.toFixed(1)}% completion). Investigate and optimize.
              </li>
            )}
            <li>📊 Review dropoff points and optimize conversion</li>
            <li>🧪 A/B test onboarding improvements</li>
            <li>📈 Monitor activation rate weekly</li>
            <li>🔔 Set up alerts for activation rate drops</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
