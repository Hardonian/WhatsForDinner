export const dynamic = 'force-dynamic';

/**
 * Subscriptions Policy Page
 */

export default function SubscriptionsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Subscription Policy</h1>
      
      <div className="prose prose-lg dark:prose-invert">
        <p className="text-muted-foreground mb-4">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Subscription Plans</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Free:</strong> Basic features with ads</li>
            <li><strong>Premium Monthly:</strong> $9.99/month, auto-renewing</li>
            <li><strong>Premium Annual:</strong> $79.99/year, auto-renewing (save 20%)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. Auto-Renewal</h2>
          <p>
            Subscriptions automatically renew at the end of each billing period unless cancelled at least 24 hours
            before the renewal date. You will be charged the renewal price at the time of renewal.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. Cancellation</h2>
          <p>
            You can cancel your subscription at any time:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>iOS:</strong> Settings ? App Store ? Subscriptions</li>
            <li><strong>Android:</strong> Google Play Store ? Subscriptions</li>
            <li><strong>Web:</strong> Settings ? Subscription ? Cancel</li>
          </ul>
          <p className="mt-2">
            Cancellation takes effect at the end of the current billing period. You will retain access until then.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. Refunds</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Refunds are available within 14 days of initial purchase</li>
            <li>Platform policies apply (Apple, Google, Stripe)</li>
            <li>Refund requests after 14 days are evaluated case-by-case</li>
            <li>No refunds for partial periods after cancellation</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. Price Changes</h2>
          <p>
            We reserve the right to change subscription prices. You will be notified at least 30 days in advance.
            Price changes apply to subsequent billing periods. If you do not agree, cancel before the next renewal.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. Restore Purchases</h2>
          <p>
            If you reinstall the app or switch devices, use "Restore Purchases" to recover your subscription.
            This requires signing in with the same account used for the original purchase.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. Family Sharing</h2>
          <p>
            Premium subscriptions can be shared with family members in your household account. Each family member
            retains their own profile and preferences.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. Failed Payments</h2>
          <p>
            If payment fails, we will attempt to charge again. After multiple failures, your subscription may be
            suspended. You will be notified via email.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
          <p>
            For subscription issues, contact:{' '}
            <a href="mailto:support@nomad.app" className="text-primary underline">
              support@nomad.app
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
