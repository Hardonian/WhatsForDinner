// @ts-nocheck
/**
 * Unified Purchase Adapter
 * Abstracts iOS StoreKit 2 and Android Play Billing v6
 */

import { Platform } from 'react-native';
import type { SubscriptionPlan } from '@whats-for-dinner/config/subscriptions';

export interface Entitlement {
  plan: SubscriptionPlan;
  productId: string;
  isActive: boolean;
  expiresAt?: number; // Unix timestamp
  willRenew?: boolean;
  purchaseDate?: number;
  transactionId?: string;
}

export interface PurchaseResult {
  success: boolean;
  entitlement?: Entitlement;
  error?: string;
  transactionId?: string;
}

export interface PurchaseAdapter {
  /**
   * Initialize the purchase system
   */
  initialize(): Promise<void>;
  
  /**
   * Get current entitlements
   */
  getEntitlements(): Promise<Entitlement[]>;
  
  /**
   * Purchase a subscription plan
   */
  purchase(plan: SubscriptionPlan): Promise<PurchaseResult>;
  
  /**
   * Restore purchases
   */
  restore(): Promise<Entitlement[]>;
  
  /**
   * Check if user has premium access
   */
  isPremium(): Promise<boolean>;
  
  /**
   * Get receipt/transaction data for server validation
   */
  getReceiptData(): Promise<string | null>;
}

/**
 * Platform-specific implementations
 */
let adapterInstance: PurchaseAdapter | null = null;

/**
 * Get the appropriate purchase adapter for the current platform
 */
export function getPurchaseAdapter(): PurchaseAdapter {
  if (adapterInstance) {
    return adapterInstance;
  }
  
  if (Platform.OS === 'ios') {
    // Dynamic import to avoid loading on Android
    const { IOSPurchaseAdapter } = require('./ios');
    adapterInstance = new IOSPurchaseAdapter();
  } else if (Platform.OS === 'android') {
    const { AndroidPurchaseAdapter } = require('./android');
    adapterInstance = new AndroidPurchaseAdapter();
  } else {
    // Web/fallback
    const { WebPurchaseAdapter } = require('./web');
    adapterInstance = new WebPurchaseAdapter();
  }
  
  return adapterInstance;
}

/**
 * Initialize purchases
 */
export async function initializePurchases(): Promise<void> {
  const adapter = getPurchaseAdapter();
  await adapter.initialize();
}

/**
 * Get entitlements
 */
export async function getEntitlements(): Promise<Entitlement[]> {
  const adapter = getPurchaseAdapter();
  return adapter.getEntitlements();
}

/**
 * Purchase a plan
 */
export async function purchase(plan: SubscriptionPlan): Promise<PurchaseResult> {
  const adapter = getPurchaseAdapter();
  return adapter.purchase(plan);
}

/**
 * Restore purchases
 */
export async function restore(): Promise<Entitlement[]> {
  const adapter = getPurchaseAdapter();
  return adapter.restore();
}

/**
 * Check if premium
 */
export async function isPremium(): Promise<boolean> {
  const adapter = getPurchaseAdapter();
  return adapter.isPremium();
}

/**
 * Get receipt data
 */
export async function getReceiptData(): Promise<string | null> {
  const adapter = getPurchaseAdapter();
  return adapter.getReceiptData();
}
