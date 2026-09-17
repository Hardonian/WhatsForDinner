export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"
            />
          </svg>
        </div>

        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          You're Offline
        </h1>

        <p className="mb-8 text-lg text-gray-600">
          It looks like you're not connected to the internet. Don't worry, you
          can still browse your saved recipes!
        </p>

        <div className="space-y-4">
          <Link
            href="/favorites"
            className="inline-block rounded-md bg-blue-500 px-6 py-3 text-white transition-colors hover:bg-blue-600"
          >
            View Saved Recipes
          </Link>

          <div className="text-sm text-gray-500">
            <p>Try refreshing the page when you're back online</p>
          </div>
        </div>
      </div>
    </div>
  );
}
