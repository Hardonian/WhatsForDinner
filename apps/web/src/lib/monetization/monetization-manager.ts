import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('index');

/**
 * Monetization Abstraction Layer
 * Provides unified interface for in-app purchases across platforms
 */

import { Capacitor } from '@capacitor/core';
import { revenueCat } from './revenuecat';
import { nativeBilling } from './native-billing';
// Note: catalog.json path relative to web app root
import catalogConfig from '../../../ops/monetization/catalog.json';

export const MONETIZATION_MODE = (process.env.MONETIZATION_MODE || 'billing_native') as
  | 'none'
  | 'billing_native'
  | 'reader_external';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  type: 'subscription' | 'consumable' | 'non_consumable';
}

export interface PurchaseResult {
  success: boolean;
  productId: string;
  transactionId?: string;
  error?: string;
}

class MonetizationManager {
  private initialized = false;

  /**
   * Initialize monetization
   */
  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    if (MONETIZATION_MODE === 'none') {
            return;
    }

    if (catalogConfig.revenuecat?.enabled && Capacitor.isNativePlatform()) {
      try {
        await revenueCat.initialize(userId);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') { _logger.warn('[Monetization] RevenueCat failed, using native billing:', { error }); }
      }
    }

    this.initialized = true;
  }

  /**
   * Get available products
   */
  async getProducts(): Promise<Product[]> {
    if (MONETIZATION_MODE === 'none') {
      return [];
    }

    try {
      if (catalogConfig.revenuecat?.enabled) {
        return await revenueCat.getProducts();
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { _logger.warn('[Monetization] RevenueCat getProducts failed:', { error }); }
    }

    // Fallback to native billing
    const productIds = Object.keys(catalogConfig.products);
    return await nativeBilling.getProducts(productIds);
  }

  /**
   * Purchase a product
   */
  async purchase(productId: string): Promise<PurchaseResult> {
    if (MONETIZATION_MODE === 'none') {
      return { success: false, productId, error: 'Monetization disabled' };
    }

    if (MONETIZATION_MODE === 'reader_external') {
      // Redirect to external subscription management
      window.open(catalogConfig.fallback_mode.reader_app.external_url, '_blank');
      return { success: false, productId, error: 'External subscription required' };
    }

    try {
      if (catalogConfig.revenuecat?.enabled) {
        const result = await revenueCat.purchaseProduct(productId);
        return { success: true, productId, transactionId: result.transactionIdentifier };
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { _logger.warn('[Monetization] RevenueCat purchase failed:', { error }); }
    }

    // Fallback to native billing
    const transaction = await nativeBilling.purchase(productId);
    const verified = await nativeBilling.verifyPurchase(transaction);

    return {
      success: verified,
      productId,
      transactionId: transaction.transactionId,
      error: verified ? undefined : 'Purchase verification failed',
    };
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<Product[]> {
    if (MONETIZATION_MODE === 'none') {
      return [];
    }

    try {
      if (catalogConfig.revenuecat?.enabled) {
        const entitlements = await revenueCat.restorePurchases();
        return entitlements.map(e => ({
          id: e.identifier,
          name: '',
          description: '',
          price: 0,
          currency: 'USD',
          type: 'subscription',
        }));
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { _logger.warn('[Monetization] RevenueCat restore failed:', { error }); }
    }

    // Fallback to native billing
    const transactions = await nativeBilling.restorePurchases();
    return transactions.map(t => ({
      id: t.productId,
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      type: 'subscription',
    }));
  }

  /**
   * Check if user has premium entitlement
   */
  async hasPremium(): Promise<boolean> {
    if (MONETIZATION_MODE === 'none') {
      return false;
    }

    try {
      if (catalogConfig.revenuecat?.enabled) {
        return await revenueCat.hasEntitlement('premium');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') { _logger.warn('[Monetization] RevenueCat check failed:', { error }); }
    }

    return false;
  }
}

export const monetization = new MonetizationManager();
