/**
 * Subscription Management Hub
 * Beautiful subscription dashboard with usage tracking
 */

'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Zap, Calendar, ArrowUpDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface SubscriptionData {
  plan: 'free' | 'pro' | 'family';
  status: string;
  currentPeriodEnd?: string;
  usage: {
    recipesGenerated: number;
    recipesLimit: number;
    customizationsUsed: number;
    customizationsLimit: number;
  };
}

export function SubscriptionHub() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/subscriptions/me')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return null;

  const usagePercent = (data.usage.recipesGenerated / data.usage.recipesLimit) * 100;
  const isNearLimit = usagePercent >= 80;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Subscription</CardTitle>
            <Badge variant={data.plan === 'free' ? 'secondary' : 'default'}>
              {data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Recipes Generated</span>
              <span className="text-sm font-semibold">
                {data.usage.recipesGenerated} / {data.usage.recipesLimit === Infinity ? '∞' : data.usage.recipesLimit}
              </span>
            </div>
            {data.usage.recipesLimit !== Infinity && (
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isNearLimit ? 'bg-orange-500' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>
            )}
          </div>

          {data.plan === 'free' && isNearLimit && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Upgrade to Pro</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  You&apos;re running low on free recipes. Upgrade for unlimited access.
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href="/pricing">View Plans</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" asChild className="flex-1">
              <Link href="/pricing">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                {data.plan === 'free' ? 'Upgrade' : 'Change Plan'}
              </Link>
            </Button>
            {data.plan !== 'free' && (
              <Button variant="outline" asChild className="flex-1">
                <Link href="/account/billing">Manage Billing</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {data.plan !== 'free' && data.currentPeriodEnd && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Billing Cycle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Renews on {new Date(data.currentPeriodEnd).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
