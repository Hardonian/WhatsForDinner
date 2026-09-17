'use client';

export const dynamic = 'force-dynamic';
/**
 * Admin Dashboard Page
 * 
 * Overview of key metrics: Active partners, Flagged campaigns, Fraud alerts, Open incidents
 */


import { useEffect, useState } from 'react';

interface DashboardMetrics {
  metrics: {
    activePartners: number;
    flaggedCampaigns: number;
    fraudAlerts: number;
    openIncidents: number;
  };
  recentCampaigns: Array<{
    id: string;
    name: string;
    status: string;
    created_at: string;
  }>;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard', {
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
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Active Partners"
          value={metrics.metrics.activePartners}
          icon="??"
        />
        <MetricCard
          title="Flagged Campaigns"
          value={metrics.metrics.flaggedCampaigns}
          icon="??"
          alert={metrics.metrics.flaggedCampaigns > 0}
        />
        <MetricCard
          title="Fraud Alerts"
          value={metrics.metrics.fraudAlerts}
          icon="??"
          alert={metrics.metrics.fraudAlerts > 0}
        />
        <MetricCard
          title="Open Incidents"
          value={metrics.metrics.openIncidents}
          icon="??"
          alert={metrics.metrics.openIncidents > 0}
        />
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Campaigns</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b">
                  <td className="p-2">{campaign.name}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        campaign.status === 'running'
                          ? 'bg-green-100 text-green-800'
                          : campaign.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>
                  <td className="p-2 text-sm text-gray-500">
                    {new Date(campaign.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  alert = false,
}: {
  title: string;
  value: number;
  icon: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-6 ${
        alert ? 'border-l-4 border-red-500' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className={`text-3xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}