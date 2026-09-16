// @ts-nocheck
/**
 * Android Purchase Adapter - Google Play Billing v6
 * Uses react-native-iap or Google Play Billing Library
 */

import type { PurchaseAdapter, Entitlement, PurchaseResult } from './index';
import type { SubscriptionPlan } from '@whats-for-dinner/config/subscriptions';
import { getSKU, isPremiumPlan } from '@whats-for-dinner/config/subscriptions';
import { Platform } from 'react-native';

export class AndroidPurchaseAdapter implements PurchaseAdapter {
  private initialized = false;
  private currentEntitlements: Entitlement[] = [];

  async initialize(): Promise<void> {
    if (this.initialized || Platform.OS !== 'android') {
      return;
    }

    try {
      // Initialize Google Play Billing
      await this.initializeBilling();
      this.initialized = true;
      
      // Load current entitlements
      await this.refreshEntitlements();
    } catch (error) {
      // Error handled: Failed to initialize Android purchases:
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

    const sku = getSKU('android', plan);
    if (!sku) {
      return {
        success: false,
        error: `SKU not found for plan: ${plan}`,
      };
    }

    try {
      // Purchase using Play Billing
      const result = await this.performPurchase(sku, plan);
      
      if (result.success && result.entitlement) {
        this.currentEntitlements.push(result.entitlement);
        
        // Acknowledge purchase (required by Play Billing)
        await this.acknowledgePurchase(result.entitlement);
        
        // Notify server
        await this.notifyServer(result.entitlement);
      }
      
      return result;
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

    try {
      // Restore purchases from Play Store
      await this.refreshEntitlements();
      
      // Sync with server
      await this.syncWithServer();
      
      return [...this.currentEntitlements];
    } catch (error) {
      // Error handled: Failed to restore purchases:
      return [];
    }
  }

  async isPremium(): Promise<boolean> {
    const entitlements = await this.getEntitlements();
    return entitlements.some(e => e.isActive && isPremiumPlan(e.plan));
  }

  async getReceiptData(): Promise<string | null> {
    try {
      // Get purchase token for server validation
      const entitlements = await this.getEntitlements();
      if (entitlements.length === 0) {
        return null;
      }

      // Return most recent purchase token
      const active = entitlements
        .filter(e => e.isActive)
        .sort((a, b) => (b.purchaseDate || 0) - (a.purchaseDate || 0))[0];
      
      return active?.transactionId || null;
    } catch (error) {
      // Error handled: Failed to get purchase data:
      return null;
    }
  }

  /**
   * Initialize Google Play Billing
   */
  private async initializeBilling(): Promise<void> {
    try {
      const IAP = await this.getIAPModule();
      if (!IAP) {
        throw new Error('IAP module not available');
      }

      // Connect to Play Billing
      await IAP.initConnection();
      
      // Get available products
      const products = await IAP.getProducts({
        skus: [getSKU('android', 'premium_monthly'), getSKU('android', 'premium_annual')],
      });
      
          } catch (error) {
      // Error handled: Billing initialization error:
      throw error;
    }
  }

  /**
   * Refresh entitlements from Play Store
   */
  private async refreshEntitlements(): Promise<void> {
    try {
      const IAP = await this.getIAPModule();
      if (!IAP) {
        return;
      }

      // Get available purchase history
      const purchases = await IAP.getAvailablePurchases();
      
      this.currentEntitlements = purchases.map((purchase: any) => {
        const plan = this.getPlanFromSKU(purchase.productId);
        const purchaseTime = purchase.purchaseTime || Date.now();
        
        return {
          plan: plan || 'free',
          productId: purchase.productId,
          isActive: purchase.transactionReceipt !== undefined,
          purchaseDate: purchaseTime,
          transactionId: purchase.transactionId || purchase.purchaseToken,
        };
      });

      // Also check subscription status for active subscriptions
      const subscriptions = await IAP.getSubscriptions([getSKU('android', 'premium_monthly'), getSKU('android', 'premium_annual')]);
      
      // Merge subscription data
      for (const sub of subscriptions) {
        const existing = this.currentEntitlements.find(e => e.productId === sub.productId);
        if (existing) {
          existing.isActive = true;
          existing.willRenew = sub.autoRenewingAndroid || false;
        } else {
          const plan = this.getPlanFromSKU(sub.productId);
          this.currentEntitlements.push({
            plan: plan || 'free',
            productId: sub.productId,
            isActive: true,
            willRenew: sub.autoRenewingAndroid || false,
          });
        }
      }
    } catch (error) {
      // Error handled: Failed to refresh entitlements:
    }
  }

  /**
   * Perform purchase
   */
  private async performPurchase(sku: string, plan: SubscriptionPlan): Promise<PurchaseResult> {
    try {
      const IAP = await this.getIAPModule();
      if (!IAP) {
        return {
          success: false,
          error: 'IAP module not available',
        };
      }

      // Request purchase
      const purchase = await IAP.requestPurchase(sku);
      
      if (!purchase || purchase.responseCode !== 0) {
        return {
          success: false,
          error: purchase?.responseCode === 1 ? 'User cancelled' : 'Purchase failed',
        };
      }

      // Create entitlement
      const entitlement: Entitlement = {
        plan,
        productId: sku,
        isActive: true,
        purchaseDate: purchase.purchaseTime || Date.now(),
        transactionId: purchase.transactionId || purchase.purchaseToken,
      };

      return {
        success: true,
        entitlement,
        transactionId: entitlement.transactionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Purchase failed',
      };
    }
  }

  /**
   * Acknowledge purchase (required by Play Billing v6)
   */
  private async acknowledgePurchase(entitlement: Entitlement): Promise<void> {
    try {
      const IAP = await this.getIAPModule();
      if (!IAP || !entitlement.transactionId) {
        return;
      }

      // Acknowledge purchase
      await IAP.acknowledgePurchaseAndroid({
        token: entitlement.transactionId,
        developerPayload: '',
      });
    } catch (error) {
      // Error handled: Failed to acknowledge purchase:
    }
  }

  /**
   * Get IAP module (react-native-iap)
   */
  private async getIAPModule(): Promise<unknown> {
    try {
      const rnIAP = require('react-native-iap');
      return rnIAP;
    } catch {
      return null;
    }
  }

  /**
   * Get plan from SKU
   */
  private getPlanFromSKU(sku: string): SubscriptionPlan | null {
    const { getPlanBySKU } = require('@whats-for-dinner/config/subscriptions');
    return getPlanBySKU('android', sku);
  }

  /**
   * Notify server of purchase
   */
  private async notifyServer(entitlement: Entitlement): Promise<void> {
    try {
      await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'android',
          productId: entitlement.productId,
          transactionId: entitlement.transactionId,
          purchaseToken: entitlement.transactionId, // Android uses purchase token
        }),
      });
    } catch (error) {
      // Error handled: Failed to notify server:
    }
  }

  /**
   * Sync entitlements with server
   */
  private async syncWithServer(): Promise<void> {
    try {
      const entitlements = await this.getEntitlements();
      const purchaseTokens = entitlements
        .filter(e => e.transactionId)
        .map(e => e.transactionId);

      if (purchaseTokens.length === 0) {
        return;
      }

      await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'android',
          purchaseTokens,
          action: 'restore',
        }),
      });
    } catch (error) {
      // Error handled: Failed to sync with server:
    }
  }
}
