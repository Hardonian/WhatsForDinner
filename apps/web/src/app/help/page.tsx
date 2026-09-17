export const dynamic = 'force-dynamic';

// [STAKE+TRUST:BEGIN:help_page]
"use client";

import Link from "next/link";

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-muted-foreground text-lg">
          How can we help you today? Find answers to common questions or contact support.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-2">Getting Started</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• How to create an account</li>
            <li>• Adding ingredients to your pantry</li>
            <li>• Generating meal suggestions</li>
            <li>• Saving favorite recipes</li>
          </ul>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-2">Account Management</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Updating your profile</li>
            <li>• Managing dietary preferences</li>
            <li>• Exporting your data</li>
            <li>• Deleting your account</li>
          </ul>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-2">Privacy & Security</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Privacy policy</li>
            <li>• Data export</li>
            <li>• Security practices</li>
            <li>• Cookie preferences</li>
          </ul>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-2">Billing & Subscriptions</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Subscription plans</li>
            <li>• Payment methods</li>
            <li>• Canceling subscription</li>
            <li>• Refund policy</li>
          </ul>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border mb-8">
        <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">How does the AI meal planning work?</h3>
            <p className="text-muted-foreground">
              Our AI analyzes the ingredients in your pantry, your dietary preferences, and cooking history 
              to suggest personalized meal ideas. Simply add your ingredients, and we'll generate recipe 
              suggestions tailored to you.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Can I use the app without an account?</h3>
            <p className="text-muted-foreground">
              You can try basic features without an account, but creating an account allows you to save 
              recipes, track your meal history, and access personalized recommendations.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">How do I export my data?</h3>
            <p className="text-muted-foreground">
              You can export your data anytime from{" "}
              <Link href="/account/export" className="text-primary hover:underline">
                your account settings
              </Link>
              . Data is provided in JSON or CSV format.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Is my data secure?</h3>
            <p className="text-muted-foreground">
              Yes. We use industry-standard encryption, secure authentication, and follow best practices 
              for data protection. Learn more in our{" "}
              <Link href="/trust/security" className="text-primary hover:underline">
                security documentation
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-2xl font-semibold mb-4">Still Need Help?</h2>
        <p className="text-muted-foreground mb-4">
          Contact our support team and we'll get back to you as soon as possible.
        </p>
        <div className="space-y-2">
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:support@whatsfordinner.com" className="text-primary hover:underline">
              support@whatsfordinner.com
            </a>
          </p>
          <p>
            <strong>Response Time:</strong> Within 24 hours (Monday-Friday)
          </p>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/support"
          className="text-primary hover:underline"
        >
          Contact Support →
        </Link>
        <Link
          href="/status"
          className="text-primary hover:underline"
        >
          Check System Status →
        </Link>
      </div>
    </div>
  );
}
// [STAKE+TRUST:END:help_page]
