export const dynamic = 'force-dynamic';

/**
 * Terms of Service Page
 */

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      
      <div className="prose prose-lg dark:prose-invert">
        <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
          <p>
            By accessing or using Nomad, you agree to be bound by these Terms of Service and our Privacy Policy.
            If you do not agree, do not use our service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
          <p>
            You must be at least 13 years old to use Nomad. Users between 13 and 18 must have parental consent.
            Accounts for users under 13 are not permitted.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Account Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining account security</li>
            <li>You must provide accurate information</li>
            <li>You may not share your account with others</li>
            <li>You are responsible for all activity under your account</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Subscription Terms</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Subscriptions auto-renew unless cancelled 24 hours before renewal</li>
            <li>Refunds are available within 14 days of initial purchase (subject to platform policies)</li>
            <li>Price changes will be communicated 30 days in advance</li>
            <li>Cancellation takes effect at the end of the current billing period</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the service for illegal purposes</li>
            <li>Upload malicious content or viruses</li>
            <li>Attempt to reverse engineer or hack the service</li>
            <li>Impersonate others or provide false information</li>
            <li>Harass, abuse, or harm other users</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
          <p>
            Nomad and its content are protected by copyright, trademark, and other laws. You may not copy, modify,
            or distribute our content without permission.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Disclaimers</h2>
          <p>
            Nomad provides recipe and meal planning suggestions for informational purposes. We are not medical
            professionals and do not provide medical advice. Always consult a healthcare provider for dietary concerns.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Nomad shall not be liable for indirect, incidental, or consequential
            damages arising from your use of the service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
          <p>
            We may suspend or terminate your account if you violate these terms. You may delete your account at any time
            through Settings.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
          <p>
            We may update these terms periodically. Continued use after changes constitutes acceptance. Material changes
            will be communicated via email or in-app notification.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
          <p>
            Questions about these terms? Contact us at:{' '}
            <a href="mailto:legal@nomad.app" className="text-primary underline">
              legal@nomad.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
