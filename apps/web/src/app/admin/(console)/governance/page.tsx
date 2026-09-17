'use client';

export const dynamic = 'force-dynamic';
/**
 * Admin Data Governance Page
 * 
 * Manage retention policies, data classification, and auto-purge settings
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useEffect, useState } from 'react';

interface RetentionPolicy {
  id: string;
  category: string;
  days: number;
  auto_purge: boolean;
  last_run_at: string | null;
}

export default function GovernancePage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dryRun, setDryRun] = useState(true);
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const res = await fetch('/api/admin/governance/retention', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      const data = await res.json();
      setPolicies(data.policies || []);
      setLoading(false);
    } catch (err) {
      _logger.error('err');
      setLoading(false);
    }
  };

  const handleRun = async () => {
    const res = await fetch('/api/admin/governance/retention', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify({ dry_run: dryRun }),
    });
    const result = await res.json();
    alert(`Processed: ${result.processed}, Deleted: ${result.deleted}, Errors: ${result.errors}`);
    loadPolicies();
  };

  const handlePreview = async (category: string, days: number) => {
    const res = await fetch(
      `/api/admin/governance/retention?category=${category}&preview_days=${days}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      },
    );
    const data = await res.json();
    setPreview(data);
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Data Governance</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Data Governance</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Retention Policies</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Retention (days)</th>
                <th className="px-4 py-3 text-left">Auto Purge</th>
                <th className="px-4 py-3 text-left">Last Run</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{policy.category}</td>
                  <td className="px-4 py-3">{policy.days}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        policy.auto_purge
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {policy.auto_purge ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {policy.last_run_at
                      ? new Date(policy.last_run_at).toLocaleString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handlePreview(policy.category, policy.days)}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Run Retention Policies</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
            />
            <span>Dry Run (preview only, no deletion)</span>
          </label>
          <button
            onClick={handleRun}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Run Now
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div className="space-y-2">
            <p>
              <strong>Category:</strong> {preview.category}
            </p>
            <p>
              <strong>Retention:</strong> {preview.retentionDays} days
            </p>
            <p>
              <strong>Cutoff Date:</strong> {new Date(preview.cutoffDate).toLocaleString()}
            </p>
            <p>
              <strong>Records to Delete:</strong> {preview.recordsToDelete}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}