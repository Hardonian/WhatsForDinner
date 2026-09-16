/**
 * Admin Moderation Queue Page
 * 
 * Review and moderate campaigns, creatives, partners, and messages
 */

'use client';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('page');



import { useEffect, useState } from 'react';

interface ModerationItem {
  id: string;
  entity_kind: string;
  entity_id: string;
  priority: string;
  status: string;
  flag_reason: string;
  notes: string | null;
  created_at: string;
  entity: any;
  assigned_admin: any;
}

export default function ModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    fetch('/api/admin/moderation/queue', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setItems(data.items);
        }
        setLoading(false);
      })
      .catch((err) => {
        _logger.error('err');
        setLoading(false);
      });
  }, []);

  const handleAssign = async (itemId: string, adminId: string) => {
    await fetch('/api/admin/moderation/assign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify({ queue_id: itemId, admin_id: adminId }),
    });
    // Refresh
    window.location.reload();
  };

  const handleResolve = async (itemId: string, action: 'approve' | 'reject') => {
    await fetch('/api/admin/moderation/resolve', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
      },
      body: JSON.stringify({ queue_id: itemId, action, notes: actionNotes }),
    });
    setSelectedItem(null);
    setActionNotes('');
    // Refresh
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Moderation Queue</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Moderation Queue</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Entity</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Flag Reason</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium">{item.entity_kind}</span>
                    <div className="text-sm text-gray-500">{item.entity_id.substring(0, 8)}...</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      item.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : item.priority === 'normal'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {item.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      item.status === 'open'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'in_review'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{item.flag_reason}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {item.status === 'open' && (
                      <button
                        onClick={() => handleAssign(item.id, 'current-admin-id')}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                      >
                        Assign
                      </button>
                    )}
                    {item.status === 'in_review' && (
                      <>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                        >
                          Review
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Review Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Review Item</h2>
            <div className="mb-4">
              <p>
                <strong>Entity:</strong> {selectedItem.entity_kind}
              </p>
              <p>
                <strong>Reason:</strong> {selectedItem.flag_reason}
              </p>
            </div>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Add notes..."
              className="w-full border rounded p-2 mb-4"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleResolve(selectedItem.id, 'approve')}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Approve
              </button>
              <button
                onClick={() => handleResolve(selectedItem.id, 'reject')}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  setSelectedItem(null);
                  setActionNotes('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
