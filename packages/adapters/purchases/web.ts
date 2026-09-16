// @ts-nocheck
/**
 * Web Purchase Adapter - Server-side subscription management
 * Web subscriptions are handled server-side via Stripe or similar
 */

import type { PurchaseAdapter, Entitlement, PurchaseResult } from './index';
import type { SubscriptionPlan } from '@whats-for-dinner/config/subscriptions';
import { isPremiumPlan } from '@whats-for-dinner/config/subscriptions';

export class WebPurchaseAdapter implements PurchaseAdapter {
  private initialized = false;
  private currentEntitlements: Entitlement[] = [];

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Fetch current subscription from server
      await this.refreshEntitlements();
      this.initialized = true;
    } catch (error) {
      // Error handled: Failed to initialize web purchases:
      throw error;
    }
  }

  async getEntitlements(): Promise<Entitlement[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    await this.refreshEntitlements();
    return [...this.currentEntitlements];
  }

  async purchase(plan: SubscriptionPlan): Promise<PurchaseResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!isPremiumPlan(plan)) {
      return {
        success: false,
        error: 'Cannot purchase free plan',
      };
    }

    try {
      // Redirect to checkout or open payment modal
      const checkoutUrl = await this.getCheckoutUrl(plan);
      
      // For web, we redirect to checkout
      // The result will be handled via webhook
      if (typeof window !== 'undefined') {
        window.location.href = checkoutUrl;
      }

      return {
        success: true,
        // Entitlement will be set after payment confirmation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  async restore(): Promise<Entitlement[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    await this.refreshEntitlements();
    return [...this.currentEntitlements];
  }

  async isPremium(): Promise<boolean> {
    const entitlements = await this.getEntitlements();
    return entitlements.some(e => e.isActive && isPremiumPlan(e.plan));
  }

  async getReceiptData(): Promise<string | null> {
    // Web doesn't use receipts, subscription is server-managed
    return null;
  }

  /**
   * Refresh entitlements from server
   */
  private async refreshEntitlements(): Promise<void> {
    try {
      const response = await fetch('/api/subscriptions/current', {
        credentials: 'include',
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      
      if (data.subscription) {
        this.currentEntitlements = [{
          plan: data.subscription.plan || 'free',
          productId: data.subscription.id || '',
          isActive: data.subscription.status === 'active',
          expiresAt: data.subscription.currentPeriodEnd ? new Date(data.subscription.currentPeriodEnd).getTime() : undefined,
          willRenew: data.subscription.cancelAtPeriodEnd === false,
          purchaseDate: data.subscription.createdAt ? new Date(data.subscription.createdAt).getTime() : undefined,
          transactionId: data.subscription.id,
        }];
      }
    } catch (error) {
      // Error handled: Failed to refresh entitlements:
    }
  }

  /**
   * Get checkout URL for plan
   */
  private async getCheckoutUrl(plan: SubscriptionPlan): Promise<string> {
    const response = await fetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const data = await response.json();
    return data.checkoutUrl || '/pricing';
  }
}
