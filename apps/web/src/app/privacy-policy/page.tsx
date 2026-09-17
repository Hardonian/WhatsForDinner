export const dynamic = 'force-dynamic';

/**
 * Privacy Policy Page
 * Complete privacy policy compliant with GDPR, CCPA, etc.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - What\'s for Dinner',
  description: 'Privacy Policy for What\'s for Dinner meal planning app',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8">
        <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            What's for Dinner ("we", "our", "us") respects your privacy. This Privacy Policy explains how we 
            collect, use, disclose, and safeguard your information when you use our meal planning application.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">2.1 Information You Provide</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account Information:</strong> Name, email, password</li>
            <li><strong>Profile Data:</strong> Dietary preferences, family size, cooking preferences</li>
            <li><strong>Pantry Data:</strong> Ingredients you add to your pantry</li>
            <li><strong>Meal Plans:</strong> Recipes and meal plans you create</li>
            <li><strong>Payment Information:</strong> Processed securely by Stripe (we don't store card details)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Automatically Collected Information</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Usage Data:</strong> How you use the app, features accessed, time spent</li>
            <li><strong>Device Information:</strong> Device type, operating system, browser</li>
            <li><strong>Log Data:</strong> IP address, access times, error logs</li>
            <li><strong>Cookies:</strong> For authentication, preferences, analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and improve the Service</li>
            <li>Personalize meal suggestions and recommendations</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send service-related communications</li>
            <li>Respond to your inquiries and support requests</li>
            <li>Analyze usage patterns to improve the Service</li>
            <li>Detect and prevent fraud or abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">4.1 Service Providers</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Hosting:</strong> Supabase (database hosting)</li>
            <li><strong>Payments:</strong> Stripe (payment processing)</li>
            <li><strong>Email:</strong> SendGrid/Mailchimp (email delivery)</li>
            <li><strong>Analytics:</strong> Google Analytics (anonymized data)</li>
            <li><strong>AI Services:</strong> OpenAI (meal suggestions, data is anonymized)</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Legal Requirements</h3>
          <p>
            We may disclose information if required by law, court order, or to protect our rights and safety.
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Business Transfers</h3>
          <p>
            In the event of a merger, acquisition, or sale, your information may be transferred to the new entity.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
          <p>
            We implement industry-standard security measures:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>End-to-end encryption for sensitive data</li>
            <li>Secure authentication (Supabase Auth)</li>
            <li>Regular security audits</li>
            <li>Access controls and monitoring</li>
            <li>Data backup and recovery</li>
          </ul>
          <p className="mt-4">
            However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Your Privacy Rights</h2>
          <p>Depending on your location, you have the following rights:</p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">6.1 GDPR Rights (EU/UK)</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Request a copy of your data</li>
            <li><strong>Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your data</li>
            <li><strong>Portability:</strong> Export your data</li>
            <li><strong>Objection:</strong> Object to processing</li>
            <li><strong>Restriction:</strong> Request processing restrictions</li>
          </ul>

          <h3 className="text-xl font-semibold mb-2 mt-4">6.2 CCPA Rights (California)</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Know what personal information is collected</li>
            <li>Know if personal information is sold or disclosed</li>
            <li>Opt-out of sale of personal information</li>
            <li>Access your personal information</li>
            <li>Request deletion of personal information</li>
            <li>Non-discrimination for exercising rights</li>
          </ul>

          <p className="mt-4">
            To exercise these rights, contact us at privacy@whatsfordinner.com or use the data export feature in your account settings.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide the Service. 
            After account deletion, we retain data for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Active Data:</strong> Until account deletion</li>
            <li><strong>Backup Data:</strong> 30 days after deletion</li>
            <li><strong>Legal Requirements:</strong> As required by law (e.g., 7 years for financial records)</li>
            <li><strong>Anonymized Data:</strong> Indefinitely for analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other than your own. We ensure adequate 
            protection through:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Standard Contractual Clauses (SCCs)</li>
            <li>Privacy Shield (where applicable)</li>
            <li>Other legal mechanisms</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
          <p>
            Our Service is not intended for children under 13. We do not knowingly collect personal information 
            from children. If you believe we have, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Authentication and session management</li>
            <li>Preferences and settings</li>
            <li>Analytics and performance</li>
            <li>Marketing (with consent)</li>
          </ul>
          <p className="mt-4">
            You can manage cookie preferences in your browser settings or through our consent banner.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy. We will notify you of material changes via email or in-app notification. 
            Continued use constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
          <p>
            For privacy-related questions or to exercise your rights:
          </p>
          <p>
            <strong>Email:</strong> privacy@whatsfordinner.com<br />
            <strong>Data Protection Officer:</strong> dpo@whatsfordinner.com<br />
            <strong>Address:</strong> [Your Company Address]
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          By using What's for Dinner, you acknowledge that you have read and understood this Privacy Policy.
        </p>
      </div>
    </div>
  );
}
