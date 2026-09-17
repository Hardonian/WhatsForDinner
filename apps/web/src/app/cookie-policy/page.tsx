export const dynamic = 'force-dynamic';

/**
 * Cookie Policy Page
 * Detailed cookie usage and consent information
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy - What\'s for Dinner',
  description: 'Cookie usage policy for What\'s for Dinner',
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
      <p className="text-muted-foreground mb-8">
        <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit our website. 
            They help us provide you with a better experience and understand how you use our service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How We Use Cookies</h2>
          <p>We use cookies for the following purposes:</p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">1. Essential Cookies</h3>
          <p>
            Required for the website to function. These include authentication cookies and session management.
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">2. Analytics Cookies</h3>
          <p>
            Help us understand how visitors use our site. We use Google Analytics (anonymized) to improve our service.
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">3. Preference Cookies</h3>
          <p>
            Remember your settings and preferences, such as language and theme preferences.
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">4. Marketing Cookies</h3>
          <p>
            Used to deliver relevant advertisements and track campaign performance (with your consent).
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Managing Cookies</h2>
          <p>
            You can manage cookie preferences through:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Our cookie consent banner (when you first visit)</li>
            <li>Your browser settings (Chrome, Firefox, Safari, etc.)</li>
            <li>Your account settings (for logged-in users)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Third-Party Cookies</h2>
          <p>We use the following third-party services that may set cookies:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google Analytics:</strong> Website analytics (anonymized)</li>
            <li><strong>Stripe:</strong> Payment processing</li>
            <li><strong>Supabase:</strong> Database and authentication</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p>
            For questions about our cookie usage:
          </p>
          <p>
            <strong>Email:</strong> privacy@whatsfordinner.com
          </p>
        </section>
      </div>
    </div>
  );
}
