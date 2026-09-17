export const dynamic = 'force-dynamic';

/**
 * Terms of Service Page
 * Complete legal terms for What's for Dinner
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - What\'s for Dinner',
  description: 'Terms of Service for What\'s for Dinner meal planning app',
};

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="text-muted-foreground mb-8">
        <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
      </p>

      <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>
            By accessing or using What's for Dinner ("the Service"), you agree to be bound by these Terms of Service. 
            If you disagree with any part of these terms, you may not access the Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p>
            What's for Dinner is an AI-powered meal planning application that helps users plan meals, manage their pantry, 
            generate shopping lists, and discover recipes. The Service includes web and mobile applications.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
          <p>
            You must create an account to use certain features. You are responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete information</li>
            <li>Notifying us immediately of any unauthorized use</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Subscription Plans and Payment</h2>
          <h3 className="text-xl font-semibold mb-2 mt-4">4.1 Subscription Tiers</h3>
          <p>
            We offer Free, Pro, and Family subscription plans. Pro and Family plans require payment.
          </p>
          
          <h3 className="text-xl font-semibold mb-2 mt-4">4.2 Billing</h3>
          <p>
            Subscriptions are billed in advance on a monthly or annual basis. You authorize us to charge your 
            payment method for all applicable fees.
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">4.3 Price Changes</h3>
          <p>
            We reserve the right to modify subscription prices. We will notify you at least 30 days in advance of any 
            price changes. Your continued use after the change constitutes acceptance.
          </p>

          <h3 className="text-xl font-semibold mb-2 mt-4">4.4 Free Trial</h3>
          <p>
            We offer a 14-day free trial for Pro and Family plans. If you don't cancel before the trial ends, 
            you'll be charged automatically.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. Refund Policy</h2>
          <p>
            We offer a 30-day money-back guarantee for all paid subscriptions. To request a refund:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contact support at support@whatsfordinner.com within 30 days of purchase</li>
            <li>Refunds are processed within 5-10 business days</li>
            <li>Refunds are issued to the original payment method</li>
            <li>After 30 days, refunds are at our discretion</li>
          </ul>
          <p className="mt-4">
            <strong>Exceptions:</strong> We do not offer refunds for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Partially used subscriptions</li>
            <li>Violations of these Terms</li>
            <li>Accounts terminated for abuse</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Cancellation</h2>
          <p>
            You may cancel your subscription at any time:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Through your account settings</li>
            <li>By contacting support</li>
            <li>Cancellation takes effect at the end of your billing period</li>
            <li>No refunds for partial billing periods</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. User Content</h2>
          <p>
            You retain ownership of content you create. By using the Service, you grant us a license to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Store and process your content to provide the Service</li>
            <li>Use anonymized data for analytics and improvement</li>
            <li>Display user-generated content (with your permission)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Service for illegal purposes</li>
            <li>Violate any laws or regulations</li>
            <li>Infringe on intellectual property rights</li>
            <li>Transmit harmful code or malware</li>
            <li>Attempt to gain unauthorized access</li>
            <li>Interfere with the Service's operation</li>
            <li>Use automated systems to access the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Intellectual Property</h2>
          <p>
            The Service and its content are owned by What's for Dinner and protected by copyright, trademark, 
            and other laws. You may not copy, modify, or distribute our content without permission.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WHAT'S FOR DINNER SHALL NOT BE LIABLE FOR ANY INDIRECT, 
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE.
          </p>
          <p className="mt-4">
            Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Dispute Resolution</h2>
          <p>
            Any disputes arising from these Terms shall be resolved through binding arbitration in accordance 
            with the rules of the American Arbitration Association, except where prohibited by law.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. We will notify users of material changes 
            via email or in-app notification. Continued use constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
          <p>
            For questions about these Terms, contact us at:
          </p>
          <p>
            <strong>Email:</strong> legal@whatsfordinner.com<br />
            <strong>Address:</strong> [Your Company Address]
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t">
        <p className="text-sm text-muted-foreground">
          By using What's for Dinner, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  );
}
