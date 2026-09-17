export const dynamic = 'force-dynamic';

/**
 * Privacy Policy Page
 */

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="prose prose-lg dark:prose-invert">
        <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Nomad ("we," "our," or "us") respects your privacy and is committed to protecting your personal data.
            This privacy policy explains how we collect, use, and safeguard your information when you use our mobile
            and web applications.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Data We Collect</h2>
          <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account information (email, name, profile photo)</li>
            <li>Subscription and payment information</li>
            <li>Household and family member information</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Usage Data</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Recipe views, favorites, and interactions</li>
            <li>Meal plan selections</li>
            <li>Pantry items and preferences</li>
            <li>App usage patterns and features accessed</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Device Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Device type, operating system, and app version</li>
            <li>Advertising ID (with your consent)</li>
            <li>Crash reports and diagnostics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Data</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>App Functionality:</strong> Provide core features, meal planning, and recipe recommendations</li>
            <li><strong>Analytics:</strong> Understand usage patterns to improve our service (with consent)</li>
            <li><strong>Advertising:</strong> Show personalized ads (with consent and only for adults)</li>
            <li><strong>Communications:</strong> Send important updates, notifications, and support responses</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Legal Basis</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Contract:</strong> To fulfill our service agreement</li>
            <li><strong>Consent:</strong> For analytics and advertising (you can withdraw anytime)</li>
            <li><strong>Legitimate Interest:</strong> For security, fraud prevention, and service improvement</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
          <p>We share data only with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Service Providers:</strong> Analytics platforms (Segment, PostHog), cloud infrastructure (Supabase, AWS)</li>
            <li><strong>Payment Processors:</strong> Stripe, Apple, Google for subscription management</li>
            <li><strong>Advertising Networks:</strong> AdMob, Google Ads (only with consent and for adults)</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect rights</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Children's Privacy (COPPA)</h2>
          <p>
            We do not knowingly collect personal information from children under 13. If we become aware that a child
            under 13 has provided us with personal information, we will delete it immediately. Users under 13 cannot
            consent to advertising or tracking.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Your Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Correction:</strong> Update inaccurate information</li>
            <li><strong>Deletion:</strong> Request account deletion</li>
            <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
            <li><strong>Withdraw Consent:</strong> Change privacy preferences anytime in Settings</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Account data: Retained while account is active, deleted 30 days after account closure</li>
            <li>Analytics data: Aggregated and anonymized after 2 years</li>
            <li>Payment records: Retained for legal compliance (7 years)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Security</h2>
          <p>
            We implement industry-standard security measures including encryption, secure authentication, and regular
            security audits. However, no method of transmission over the internet is 100% secure.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. International Transfers</h2>
          <p>
            Your data may be processed in the United States and other countries. We ensure adequate protection
            through Standard Contractual Clauses and other legal mechanisms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p>
            For privacy-related inquiries, data requests, or to exercise your rights, contact us at:{' '}
            <a href="mailto:privacy@nomad.app" className="text-primary underline">
              privacy@nomad.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
