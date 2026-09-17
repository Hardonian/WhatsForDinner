'use client';


import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // Get auth token (from secure storage or session)
      const token = localStorage.getItem('auth_token'); // Replace with secure storage
      
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }

      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();

      // Redirect to home
      router.push('/?account_deleted=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-4">Delete Account</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-yellow-800">
          <strong>Warning:</strong> This action cannot be undone. All your data, including:
        </p>
        <ul className="list-disc list-inside mt-2 text-yellow-800">
          <li>Pantry items</li>
          <li>Recipe preferences</li>
          <li>Meal plans</li>
          <li>Favorites</li>
          <li>Account information</li>
        </ul>
        <p className="mt-2 text-yellow-800">will be permanently deleted.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <label className="block text-sm font-medium mb-2">
          Type <strong>DELETE</strong> to confirm:
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          placeholder="DELETE"
          disabled={isDeleting}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleDelete}
          disabled={isDeleting || confirmText !== 'DELETE'}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? 'Deleting...' : 'Delete My Account'}
        </button>
        <button
          onClick={() => router.back()}
          disabled={isDeleting}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>
          Questions? Contact us at{' '}
          <a href="mailto:support@whatsfordinner.app" className="text-blue-600 hover:underline">
            support@whatsfordinner.app
          </a>
        </p>
      </div>
    </div>
  );
}