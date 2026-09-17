'use client';

export const dynamic = 'force-dynamic';


export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            className="w-full px-4 py-2 border rounded-lg"
            defaultValue="user@example.com"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Display Name</label>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Your name"
          />
        </div>

        <div className="pt-4">
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}