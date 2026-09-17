'use client';
/**
 * Enhanced Subscription Management Page
 * Beautiful subscription hub with usage tracking
 */


import { SubscriptionHub } from '@/components/SubscriptionHub';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function SubscriptionPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription, track usage, and upgrade your plan
        </p>
      </div>

      <SubscriptionHub />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" asChild>
              <Link href="/support">Contact Support</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pricing">
                Compare Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}