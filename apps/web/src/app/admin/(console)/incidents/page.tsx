'use client';

export const dynamic = 'force-dynamic';
/**
 * Admin Incidents Page
 * 
 * Manage incidents, timeline, and severity tracking
 */

import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useEffect, useState } from 'react';

interface Incident {
  id: string;
  title: string;
  severity: string;
  summary: string;
  status: string;
  timeline: Array<{
    ts: string;
    actor_id: string;
    action: string;
    details?: Record<string, unknown>;
  }>;
  created_at: string;
  closed_at: string | null;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    severity: 'low' as 'low' | 'major' | 'critical',
    summary: '',
  });

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const res = await fetch('/api/admin/incidents', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });
      const data = await res.json();
      setIncidents(data);
      setLoading(false);
    } catch (err) {
      _logger.error('err');
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    await fetch('/api/admin/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify(newIncident),
    });
    setShowCreate(false);
    setNewIncident({ title: '', severity: 'low', summary: '' });
    loadIncidents();
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Incidents</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Incidents</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Create Incident
        </button>
      </div>

      <div className="space-y-4">
        {incidents.map((incident) => (
          <div key={incident.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{incident.title}</h2>
                <p className="text-gray-600 mt-1">{incident.summary}</p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    incident.severity === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : incident.severity === 'major'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {incident.severity}
                </span>
                <span
                  className={`px-3 py-1 rounded text-sm ${
                    incident.status === 'open'
                      ? 'bg-blue-100 text-blue-800'
                      : incident.status === 'closed'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {incident.status}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-4 border-t pt-4">
              <h3 className="font-semibold mb-2">Timeline</h3>
              <div className="space-y-2">
                {incident.timeline.map((entry, idx) => (
                  <div key={idx} className="text-sm text-gray-600">
                    <span className="font-medium">{entry.action}</span> -{' '}
                    {new Date(entry.ts).toLocaleString()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Create Incident</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title"
                value={newIncident.title}
                onChange={(e) => setNewIncident({ ...newIncident, title: e.target.value })}
                className="w-full border rounded p-2"
              />
              <select
                value={newIncident.severity}
                onChange={(e) =>
                  setNewIncident({ ...newIncident, severity: e.target.value as any })
                }
                className="w-full border rounded p-2"
              >
                <option value="low">Low</option>
                <option value="major">Major</option>
                <option value="critical">Critical</option>
              </select>
              <textarea
                placeholder="Summary"
                value={newIncident.summary}
                onChange={(e) => setNewIncident({ ...newIncident, summary: e.target.value })}
                className="w-full border rounded p-2"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}