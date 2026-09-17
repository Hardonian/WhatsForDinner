'use client';
/**
 * Controls Dashboard
 *
 * View SOC2/ISO27001 controls status, evidence links, filter by framework
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useEffect, useState } from 'react';

interface Control {
  id: string;
  key: string;
  framework: 'soc2' | 'iso27001' | 'custom';
  name: string;
  description: string;
  owner: string;
  frequency: string;
  status: 'passing' | 'failing' | 'waived';
  last_checked_at: string | null;
}

interface ControlsDashboard {
  total: number;
  byStatus: {
    passing: number;
    failing: number;
    waived: number;
  };
  byFramework: {
    soc2: number;
    iso27001: number;
    custom: number;
  };
  controls: Control[];
}

export default function ControlsDashboardPage() {
  const [dashboard, setDashboard] = useState<ControlsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch('/api/admin/controls/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
      setLoading(false);
    } catch (err) {
      _logger.error('err');
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Control['status']) => {
    const styles = {
      passing: 'bg-green-100 text-green-800',
      failing: 'bg-red-100 text-red-800',
      waived: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-sm font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const getFrameworkBadge = (framework: Control['framework']) => {
    const styles = {
      soc2: 'bg-blue-100 text-blue-800',
      iso27001: 'bg-purple-100 text-purple-800',
      custom: 'bg-gray-100 text-gray-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-sm font-medium ${styles[framework]}`}>
        {framework.toUpperCase()}
      </span>
    );
  };

  const filteredControls = dashboard?.controls.filter((c) => {
    if (frameworkFilter !== 'all' && c.framework !== frameworkFilter) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Controls Dashboard</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Controls Dashboard</h1>

      {/* Summary Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Controls</div>
            <div className="text-2xl font-bold">{dashboard.total}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Passing</div>
            <div className="text-2xl font-bold text-green-600">{dashboard.byStatus.passing}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Failing</div>
            <div className="text-2xl font-bold text-red-600">{dashboard.byStatus.failing}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Waived</div>
            <div className="text-2xl font-bold text-gray-600">{dashboard.byStatus.waived}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Framework</label>
            <select
              value={frameworkFilter}
              onChange={(e) => setFrameworkFilter(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Frameworks</option>
              <option value="soc2">SOC 2</option>
              <option value="iso27001">ISO 27001</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="all">All Statuses</option>
              <option value="passing">Passing</option>
              <option value="failing">Failing</option>
              <option value="waived">Waived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Controls Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Key</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Framework</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">Frequency</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Last Checked</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredControls.map((control) => (
              <tr key={control.id}>
                <td className="px-4 py-3 font-mono text-sm">{control.key}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{control.name}</div>
                  <div className="text-sm text-gray-500">{control.description}</div>
                </td>
                <td className="px-4 py-3">{getFrameworkBadge(control.framework)}</td>
                <td className="px-4 py-3">{control.owner}</td>
                <td className="px-4 py-3 text-sm">{control.frequency}</td>
                <td className="px-4 py-3">{getStatusBadge(control.status)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {control.last_checked_at
                    ? new Date(control.last_checked_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/admin/governance/controls/${control.id}`}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Evidence
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredControls.length === 0 && (
          <div className="p-6 text-center text-gray-500">No controls match the selected filters.</div>
        )}
      </div>
    </div>
  );
}