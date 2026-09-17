'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';

interface Subscription {
  id: string;
  plan: 'free' | 'premium' | 'pro';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionManagerProps {
  userId: string;
}

export function SubscriptionManager({ userId = 'anonymous' }: { userId?: string }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subscriptions/me`, {
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load subscription');
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      logger.error('Failed to load subscription', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'premium' | 'pro') => {
    try {
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      logger.error('Failed to upgrade subscription', { error: err });
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      const response = await fetch(`/api/subscriptions/${subscription?.id}/cancel`, {
        method: 'POST',
        headers: {
          'x-user-id': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await loadSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      logger.error('Failed to cancel subscription', { error: err });
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading subscription...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-destructive">Error: {error}</div>;
  }

  if (!subscription) {
    return (
      <div className="p-6 bg-card border border-border rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Choose a Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-semibold mb-2">Free</h4>
            <p className="text-2xl font-bold mb-4">$0</p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-2">
              <li>? Basic recipes</li>
              <li>? Limited AI suggestions</li>
            </ul>
          </div>
          <div className="p-4 border border-primary rounded-lg">
            <h4 className="font-semibold mb-2">Premium</h4>
            <p className="text-2xl font-bold mb-4">$9.99/mo</p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-2">
              <li>? Unlimited recipes</li>
              <li>? Advanced AI suggestions</li>
              <li>? Meal planning</li>
            </ul>
            <button
              onClick={() => handleUpgrade('premium')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Upgrade
            </button>
          </div>
          <div className="p-4 border border-border rounded-lg">
            <h4 className="font-semibold mb-2">Pro</h4>
            <p className="text-2xl font-bold mb-4">$19.99/mo</p>
            <ul className="text-sm text-muted-foreground mb-4 space-y-2">
              <li>? Everything in Premium</li>
              <li>? Priority support</li>
              <li>? Custom meal plans</li>
            </ul>
            <button
              onClick={() => handleUpgrade('pro')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <h3 className="text-xl font-semibold mb-4">Current Subscription</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Plan</p>
          <p className="text-lg font-semibold capitalize">{subscription.plan}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Status</p>
          <p className="text-lg font-semibold capitalize">{subscription.status}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Next Billing Date</p>
          <p className="text-lg">
            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
          </p>
        </div>
        {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-destructive text-destructive rounded-md hover:bg-destructive/10"
          >
            Cancel Subscription
          </button>
        )}
        {subscription.cancelAtPeriodEnd && (
          <p className="text-sm text-muted-foreground">
            Subscription will cancel at the end of the billing period.
          </p>
        )}
      </div>
    </div>
  );
}

export default SubscriptionManager;
