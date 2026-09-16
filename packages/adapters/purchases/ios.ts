// @ts-nocheck
/**
 * iOS Purchase Adapter - StoreKit 2
 * Uses expo-in-app-purchases or native StoreKit 2
 */

import type { PurchaseAdapter, Entitlement, PurchaseResult } from './index';
import type { SubscriptionPlan } from '@whats-for-dinner/config/subscriptions';
import { getSKU, isPremiumPlan } from '@whats-for-dinner/config/subscriptions';
import { Platform } from 'react-native';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('ios-ts');
export class IOSPurchaseAdapter implements PurchaseAdapter {
  private initialized = false;
  private currentEntitlements: Entitlement[] = [];
  private listeners: Map<string, (entitlement: Entitlement) => void> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized || Platform.OS !== 'ios') {
      return;
    }

    try {
      // Initialize StoreKit 2
      // In production, use expo-in-app-purchases or react-native-iap
      await this.initializeStoreKit();
      this.initialized = true;
      
      // Load current entitlements
      await this.refreshEntitlements();
    } catch (error) {
      // Error handled: Failed to initialize iOS purchases:
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

    const sku = getSKU('ios', plan);
    if (!sku) {
      return {
        success: false,
        error: `SKU not found for plan: ${plan}`,
      };
    }

    try {
      // Purchase using StoreKit 2
      const result = await this.performPurchase(sku, plan);
      
      if (result.success && result.entitlement) {
        this.currentEntitlements.push(result.entitlement);
        
        // Notify server of purchase
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
      // Restore transactions from App Store
      await this.refreshEntitlements();
      
      // Also sync with server
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
      // Get App Store receipt
      // In production, use expo-in-app-purchases getReceiptAsync()
      return await this.fetchReceipt();
    } catch (error) {
      // Error handled: Failed to get receipt:
      return null;
    }
  }

  /**
   * Initialize StoreKit 2
   */
  private async initializeStoreKit(): Promise<void> {
    // In production, use:
    // - expo-in-app-purchases
    // - or react-native-iap
    // - or native StoreKit 2 module
    
    try {
      // Check if IAP module is available
      const IAP = await this.getIAPModule();
      if (IAP) {
        await IAP.connectAsync();
        return;
      }
      
      // Fallback: StoreKit 2 via native module
      // This would require a custom native module
      if (process.env.NODE_ENV === 'development') { logger.warn('IAP module not available, using fallback'); }
    } catch (error) {
      // Error handled: StoreKit initialization error:
      throw error;
    }
  }

  /**
   * Refresh entitlements from StoreKit
   */
  private async refreshEntitlements(): Promise<void> {
    try {
      const IAP = await this.getIAPModule();
      if (!IAP) {
        // Fallback: use cached or return empty
        return;
      }

      // Get current subscriptions
      const subscriptions = await IAP.getSubscriptionsAsync();
      this.currentEntitlements = subscriptions.map((sub: any) => {
        const plan = this.getPlanFromSKU(sub.productId);
        return {
          plan: plan || 'free',
          productId: sub.productId,
          isActive: sub.isActive || false,
          expiresAt: sub.expiresDate ? new Date(sub.expiresDate).getTime() : undefined,
          willRenew: sub.willRenew || false,
          purchaseDate: sub.purchaseDate ? new Date(sub.purchaseDate).getTime() : undefined,
          transactionId: sub.transactionId || sub.originalTransactionId,
        };
      });
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

      // Purchase subscription
      const purchase = await IAP.purchaseItemAsync(sku);
      
      if (!purchase) {
        return {
          success: false,
          error: 'Purchase was cancelled',
        };
      }

      // Create entitlement
      const entitlement: Entitlement = {
        plan,
        productId: sku,
        isActive: true,
        expiresAt: purchase.expiresDate ? new Date(purchase.expiresDate).getTime() : undefined,
        willRenew: true,
        purchaseDate: Date.now(),
        transactionId: purchase.transactionId || purchase.originalTransactionId,
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
   * Get IAP module (expo-in-app-purchases or react-native-iap)
   */
  private async getIAPModule(): Promise<unknown> {
    try {
      // Try expo-in-app-purchases first
      const expoIAP = await import('expo-in-app-purchases');
      return expoIAP.default || expoIAP;
    } catch {
      try {
        // Fallback to react-native-iap
        const rnIAP = require('react-native-iap');
        return rnIAP;
      } catch {
        return null;
      }
    }
  }

  /**
   * Get plan from SKU
   */
  private getPlanFromSKU(sku: string): SubscriptionPlan | null {
    const { getPlanBySKU } = require('@whats-for-dinner/config/subscriptions');
    return getPlanBySKU('ios', sku);
  }

  /**
   * Fetch App Store receipt
   */
  private async fetchReceipt(): Promise<string | null> {
    try {
      const IAP = await this.getIAPModule();
      if (!IAP) {
        return null;
      }

      // Get receipt
      const receipt = await IAP.getReceiptAsync();
      return receipt || null;
    } catch {
      return null;
    }
  }

  /**
   * Notify server of purchase
   */
  private async notifyServer(entitlement: Entitlement): Promise<void> {
    try {
      const receiptData = await this.getReceiptData();
      
      await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'ios',
          productId: entitlement.productId,
          transactionId: entitlement.transactionId,
          receipt: receiptData,
        }),
      });
    } catch (error) {
      // Error handled: Failed to notify server:
      // Don't throw - this is non-critical
    }
  }

  /**
   * Sync entitlements with server
   */
  private async syncWithServer(): Promise<void> {
    try {
      const receiptData = await this.getReceiptData();
      if (!receiptData) {
        return;
      }

      await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: 'ios',
          receipt: receiptData,
          action: 'restore',
        }),
      });
    } catch (error) {
      // Error handled: Failed to sync with server:
    }
  }
}
