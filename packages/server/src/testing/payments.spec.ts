// @ts-nocheck
/**
 * Payment Verification Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { verifyAppleReceipt } from '../payments/apple';
import { verifyGooglePurchase } from '../payments/google';

describe('Payment Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Apple Receipt Verification', () => {
    it('should verify JWT receipt', async () => {
      // Mock JWT receipt
      const mockReceipt = createMockJWTReceipt({
        productId: 'com.nomad.premium.month',
        transactionId: 'test-transaction-123',
        expiresDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const result = await verifyAppleReceipt({
        receipt: mockReceipt,
        transactionId: 'test-transaction-123',
        productId: 'com.nomad.premium.month',
        userId: 'test-user',
      });

      expect(result).toBeTruthy();
      expect(result?.isActive).toBe(true);
      expect(result?.productId).toBe('com.nomad.premium.month');
    });

    it('should reject invalid receipt', async () => {
      const result = await verifyAppleReceipt({
        receipt: 'invalid-receipt',
        userId: 'test-user',
      });

      expect(result).toBeNull();
    });

    it('should handle expired subscription', async () => {
      const mockReceipt = createMockJWTReceipt({
        productId: 'com.nomad.premium.month',
        expiresDate: new Date(Date.now() - 1000).toISOString(), // Expired
      });

      const result = await verifyAppleReceipt({
        receipt: mockReceipt,
        userId: 'test-user',
      });

      expect(result?.isActive).toBe(false);
    });
  });

  describe('Google Purchase Verification', () => {
    it('should verify purchase token', async () => {
      const result = await verifyGooglePurchase({
        purchaseToken: 'valid-purchase-token-123',
        productId: 'nomad_premium_month',
        userId: 'test-user',
      });

      expect(result).toBeTruthy();
      expect(result?.isActive).toBe(true);
    });

    it('should reject invalid token', async () => {
      const result = await verifyGooglePurchase({
        purchaseToken: '',
        userId: 'test-user',
      });

      expect(result).toBeNull();
    });
  });
});

/**
 * Helper to create mock JWT receipt
 */
function createMockJWTReceipt(data: {
  productId: string;
  transactionId?: string;
  expiresDate?: string;
}): string {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: 'test' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    transactionInfo: {
      productId: data.productId,
      transactionId: data.transactionId || 'test-transaction',
      expiresDate: data.expiresDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  })).toString('base64url');
  const signature = 'mock-signature';
  
  return `${header}.${payload}.${signature}`;
}
