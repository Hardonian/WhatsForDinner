// @ts-nocheck
import { describe, it, expect } from '@jest/globals';
import * as module from '../stripe.ts';
import { StripeService, STRIPE_CONFIG } from '../stripe.ts';

describe('stripe service', () => {
  it('should export expected functions/classes', () => {
    expect(module).toBeDefined();
    expect(typeof module).toBe('object');
    expect(StripeService).toBeDefined();
    expect(STRIPE_CONFIG).toBeDefined();
  });

  it('should have properly configured subscription plans', () => {
    expect(STRIPE_CONFIG.plans.free.price).toBe(0);
    expect(STRIPE_CONFIG.plans.pro.price).toBe(9.99);
    expect(STRIPE_CONFIG.plans.family.price).toBe(19.99);
    expect(STRIPE_CONFIG.plans.pro.features.length).toBeGreaterThan(0);
  });

  it('should calculate AI token costs accurately', () => {
    const costGpt4o = StripeService.calculateTokenCost(10000, 'gpt-4o');
    expect(costGpt4o).toBeCloseTo(0.05);

    const costMini = StripeService.calculateTokenCost(20000, 'gpt-4o-mini');
    expect(costMini).toBeCloseTo(0.003);
  });

  it('should expose webhook event handlers', () => {
    expect(typeof StripeService.handleCheckoutSessionCompleted).toBe('function');
    expect(typeof StripeService.handleSubscriptionUpdated).toBe('function');
    expect(typeof StripeService.handleSubscriptionDeleted).toBe('function');
    expect(typeof StripeService.handleInvoicePaid).toBe('function');
    expect(typeof StripeService.handleInvoicePaymentFailed).toBe('function');
  });
});
