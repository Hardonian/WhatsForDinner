'use client';

export const dynamic = 'force-dynamic';


import Link from 'next/link';

export default function LegalPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Legal</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Privacy Policy</h2>
          <p className="text-gray-600 mb-4">
            Learn how we collect, use, and protect your data.
          </p>
          <Link
            href="/legal/privacy.html"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            View Privacy Policy
          </Link>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-2xl font-semibold mb-2">Terms of Service</h2>
          <p className="text-gray-600 mb-4">
            Review our terms and conditions.
          </p>
          <Link
            href="/legal/terms.html"
            className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            View Terms of Service
          </Link>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-2xl font-semibold mb-2">Contact</h2>
          <p className="text-gray-600">
            For legal inquiries, contact:{' '}
            <a
              href="mailto:legal@whatsfordinner.app"
              className="text-blue-600 hover:underline"
            >
              legal@whatsfordinner.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}