/**
 * DSAR Portal - Self-Serve Privacy Requests
 *
 * Users can create and track Data Subject Access Requests (export, erase, restrict, rectify)
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useEffect, useState } from 'react';

interface DSARRequest {
  id: string;
  type: 'export' | 'erase' | 'restrict' | 'rectify';
  status: 'received' | 'verifying' | 'in_progress' | 'complete' | 'rejected';
  submitted_at: string;
  verified_at: string | null;
  completed_at: string | null;
  window_deadline: string;
  region: 'gdpr' | 'ccpa' | 'cpra' | 'other';
}

export default function DSARPortalPage() {
  const [requests, setRequests] = useState<DSARRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    type: 'export' as const,
    reason: '',
    region: 'gdpr' as const,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      // In production, get email from auth context
      const email = localStorage.getItem('user_email') || '';
      if (!email) {
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/privacy/requests/me?email=${encodeURIComponent(email)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
      setLoading(false);
    } catch (err) {
      _logger.error('err');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/privacy/dsar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create request');
        return;
      }

      setSuccess('Request created! Please check your email for verification.');
      setShowForm(false);
      setFormData({ email: '', type: 'export', reason: '', region: 'gdpr' });
      loadRequests();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: DSARRequest['status']) => {
    const styles = {
      received: 'bg-gray-100 text-gray-800',
      verifying: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      complete: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-sm font-medium ${styles[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getTypeLabel = (type: DSARRequest['type']) => {
    const labels = {
      export: 'Data Export',
      erase: 'Data Erasure',
      restrict: 'Restrict Processing',
      rectify: 'Rectify Data',
    };
    return labels[type];
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Requests</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Privacy Requests</h1>
      <p className="text-gray-600 mb-6">
        Request a copy of your data, request deletion, restrict processing, or correct your information.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-4">
          {success}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Privacy Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Request Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="export">Export My Data</option>
                <option value="erase">Erase My Data</option>
                <option value="restrict">Restrict Processing</option>
                <option value="rectify">Rectify Data</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value as any })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="gdpr">GDPR (EU/UK)</option>
                <option value="ccpa">CCPA (California)</option>
                <option value="cpra">CPRA (California)</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Reason (optional)</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                rows={3}
                placeholder="Additional context for your request..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Your Requests</h2>
        </div>

        {requests.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No requests yet. Create a new request above.
          </div>
        ) : (
          <div className="divide-y">
            {requests.map((req) => (
              <div key={req.id} className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{getTypeLabel(req.type)}</h3>
                    <p className="text-sm text-gray-500">
                      Submitted: {new Date(req.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  <p>
                    <strong>Region:</strong> {req.region.toUpperCase()}
                  </p>
                  <p>
                    <strong>Deadline:</strong>{' '}
                    {new Date(req.window_deadline).toLocaleDateString()}
                  </p>
                  {req.verified_at && (
                    <p>
                      <strong>Verified:</strong> {new Date(req.verified_at).toLocaleDateString()}
                    </p>
                  )}
                  {req.completed_at && (
                    <p>
                      <strong>Completed:</strong> {new Date(req.completed_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> After submitting, you'll receive an email verification link. Your
          request will be processed within the legal timeframe for your region (typically 30 days
          for GDPR, 45 days for CCPA/CPRA).
        </p>
      </div>
    </div>
  );
}
