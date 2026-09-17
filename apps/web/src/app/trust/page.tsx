'use client';

// [STAKE+TRUST:BEGIN:trust_page]
import Link from "next/link";
import { Metadata } from "next";

export default function TrustCenter() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Trust & Transparency</h1>
        <p className="text-muted-foreground text-lg">
          Your trust is important to us. Explore our commitment to privacy, security, and transparency.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-2">Privacy</h2>
          <p className="text-muted-foreground mb-4">
            Learn how we protect your data and respect your privacy rights.
          </p>
          <Link 
            href="/privacy" 
            className="text-primary hover:underline font-medium"
          >
            View Privacy Policy →
          </Link>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-2">Security</h2>
          <p className="text-muted-foreground mb-4">
            Understand our security practices and infrastructure.
          </p>
          <Link 
            href="/trust/security" 
            className="text-primary hover:underline font-medium"
          >
            View Security Info →
          </Link>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-2">Status & Uptime</h2>
          <p className="text-muted-foreground mb-4">
            Monitor service status and incident communications.
          </p>
          <Link 
            href="/status" 
            className="text-primary hover:underline font-medium"
          >
            View Status Page →
          </Link>
        </div>

        <div className="bg-card rounded-lg p-6 border">
          <h2 className="text-2xl font-semibold mb-2">Help Center</h2>
          <p className="text-muted-foreground mb-4">
            Get help with using the service and find answers to common questions.
          </p>
          <Link 
            href="/help" 
            className="text-primary hover:underline font-medium"
          >
            Visit Help Center →
          </Link>
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 border mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Data Rights</h2>
        <ul className="space-y-3">
          <li>
            <Link 
              href="/account/export" 
              className="text-primary hover:underline flex items-center gap-2"
            >
              <span>📥</span>
              <span>Export My Data</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/account/audit-log" 
              className="text-primary hover:underline flex items-center gap-2"
            >
              <span>📋</span>
              <span>View My Audit Log</span>
            </Link>
          </li>
          <li>
            <Link 
              href="/settings/account/delete" 
              className="text-primary hover:underline flex items-center gap-2"
            >
              <span>🗑️</span>
              <span>Delete My Account</span>
            </Link>
          </li>
        </ul>
      </div>

      <div className="bg-card rounded-lg p-6 border">
        <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <strong>Privacy:</strong>{" "}
            <a href="mailto:privacy@whatsfordinner.com" className="text-primary hover:underline">
              privacy@whatsfordinner.com
            </a>
          </li>
          <li>
            <strong>Security:</strong>{" "}
            <a href="mailto:security@whatsfordinner.com" className="text-primary hover:underline">
              security@whatsfordinner.com
            </a>
          </li>
          <li>
            <strong>Support:</strong>{" "}
            <a href="mailto:support@whatsfordinner.com" className="text-primary hover:underline">
              support@whatsfordinner.com
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
// [STAKE+TRUST:END:trust_page]