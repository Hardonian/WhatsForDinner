export const dynamic = 'force-dynamic';

/**
 * Refund Policy Page
 * Clear refund terms and process
 */

import { Metadata } from 'next';
import { Check, Clock, CreditCard, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy - What\'s for Dinner',
  description: 'Refund policy and terms for What\'s for Dinner subscriptions',
};

export default function RefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
      <p className="text-muted-foreground mb-12">
        <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">30-Day Money-Back Guarantee</h2>
          <p className="mb-4">
            We stand behind our service. If you're not satisfied with What's for Dinner within 30 days of your purchase, 
            we'll refund your money, no questions asked.
          </p>
        </section>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <Clock className="w-8 h-8 text-primary mb-2" />
              <CardTitle>30 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Full refund if requested within 30 days of purchase
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CreditCard className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Original Method</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Refunds issued to your original payment method
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Check className="w-8 h-8 text-primary mb-2" />
              <CardTitle>No Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Simple process, no hassle required
              </p>
            </CardContent>
          </Card>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
          <div className="space-y-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Contact Support</h3>
                <p className="text-muted-foreground">
                  Email us at <a href="mailto:support@whatsfordinner.com" className="text-primary hover:underline">support@whatsfordinner.com</a> or 
                  use the support form in your account settings.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Provide Details</h3>
                <p className="text-muted-foreground">
                  Include your account email and subscription details. We'll process your request promptly.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Receive Refund</h3>
                <p className="text-muted-foreground">
                  Refunds are processed within 5-10 business days and appear in your account within 2-3 business days.
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <Button asChild className="w-full md:w-auto">
                <Link href="/support">
                  <Mail className="w-4 h-4 mr-2" />
                  Request Refund
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Refund Terms</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Eligible Refunds</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Full refunds within 30 days of purchase</li>
                <li>Pro-rated refunds after 30 days (at our discretion)</li>
                <li>Annual plans: Pro-rated refund for unused months</li>
                <li>All subscription tiers eligible</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Processing Time</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Request Processing:</strong> 1-2 business days</li>
                <li><strong>Refund Processing:</strong> 5-10 business days</li>
                <li><strong>Bank Processing:</strong> 2-3 business days</li>
                <li><strong>Total Time:</strong> 8-15 business days</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Non-Refundable Items</h3>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Partially used subscriptions after 30 days</li>
                <li>Accounts terminated for Terms of Service violations</li>
                <li>Gift cards or promotional credits (unless required by law)</li>
                <li>Third-party fees (payment processing fees are non-refundable)</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Cancellation vs Refund</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cancellation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Canceling stops future billing but doesn't refund past payments. 
                  You retain access until the end of your billing period.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings/billing">Cancel Subscription</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Refund</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Refunds return your money and immediately cancel your subscription. 
                  Access ends immediately upon refund processing.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/support">Request Refund</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Questions?</h2>
          <p className="mb-4">
            If you have questions about refunds or need assistance, we're here to help:
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" asChild>
              <Link href="/support">
                <Mail className="w-4 h-4 mr-2" />
                Contact Support
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:support@whatsfordinner.com">
                support@whatsfordinner.com
              </a>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
