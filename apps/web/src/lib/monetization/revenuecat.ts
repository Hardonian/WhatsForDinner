import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('revenuecat');

/**
 * RevenueCat Integration
 * Abstraction layer for in-app purchases
 */

import { Capacitor } from '@capacitor/core';

export interface Product {
  identifier: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: 'subscription' | 'consumable' | 'non_consumable';
}

export interface PurchaseResult {
  productIdentifier: string;
  transactionIdentifier: string;
  receipt: string;
}

export interface Entitlement {
  identifier: string;
  isActive: boolean;
  willRenew: boolean;
  periodType: 'NORMAL' | 'TRIAL' | 'INTRO';
  latestPurchaseDate: string;
  expirationDate: string | null;
}

class RevenueCatManager {
  private isInitialized = false;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_REVENUECAT_PUBLIC_KEY || '';
  }

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(userId?: string): Promise<void> {
    if (this.isInitialized) return;

    try {
      // In production, initialize RevenueCat SDK
      // For web, this would be a placeholder
      if (Capacitor.isNativePlatform()) {
        // Native RevenueCat SDK initialization
        // await Purchases.configure({ apiKey: this.apiKey, appUserID: userId });
        _logger.info('RevenueCat configured for native platform');
      } else {
        _logger.info('RevenueCat not available on web platform');
      }

      if (userId) {
        await this.identifyUser(userId);
      }

      this.isInitialized = true;
    } catch (error) {
      // Error handled: [RevenueCat] Initialization error:
      throw error;
    }
  }

  /**
   * Identify user for RevenueCat
   */
  async identifyUser(userId: string): Promise<void> {
    // await Purchases.logIn(userId);
      }

  /**
   * Get available products
   */
  async getProducts(): Promise<Product[]> {
    // In production: await Purchases.getOfferings()
    // For now, return products from catalog
    const catalog = await import('../../../../ops/monetization/catalog.json');
    return Object.values(catalog.default.products).map(p => ({
      identifier: p.ios_product_id,
      title: p.name || '',
      description: p.description || '',
      price: p.price_tiers?.usd || 0,
      currency: 'USD',
      type: p.type === 'subscription' ? 'subscription' : 'non_consumable',
    }));
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<PurchaseResult> {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Purchases only available on native platforms');
    }

    // In production: await Purchases.purchasePackage(package)
    throw new Error('RevenueCat SDK not integrated - use fallback native billing');
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<Entitlement[]> {
    if (!Capacitor.isNativePlatform()) {
      return [];
    }

    // In production: await Purchases.restorePurchases()
    return [];
  }

  /**
   * Get current entitlements
   */
  async getEntitlements(): Promise<Record<string, Entitlement>> {
    // In production: await Purchases.getCustomerInfo()
    return {};
  }

  /**
   * Check if user has active entitlement
   */
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    const entitlements = await this.getEntitlements();
    return entitlements[entitlementId]?.isActive || false;
  }
}

export const revenueCat = new RevenueCatManager();
