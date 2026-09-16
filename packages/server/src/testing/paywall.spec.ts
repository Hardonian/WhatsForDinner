// @ts-nocheck
/**
 * Paywall API Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GET } from '../routes/paywall';
import type { NextRequest } from 'next/server';
import { db } from '../db/index';
import { pricingRules, experiments, experimentVariants } from '../db/schema';

describe('Paywall API', () => {
  beforeEach(async () => {
    // Create test pricing rule
    await db.insert(pricingRules).values({
      country: 'US',
      platform: 'web',
      plan: 'monthly',
      price_cents: 999,
      currency: 'USD',
      active: true,
    });

    // Create test experiment
    const [exp] = await db.insert(experiments).values({
      key: 'exp_paywall_2025q4',
      status: 'running',
      primary_metric: 'conversion_rate',
    }).returning();

    await db.insert(experimentVariants).values([
      { experiment_id: exp.id, key: 'control', weight: 50 },
      { experiment_id: exp.id, key: 'variant_a', weight: 50 },
    ]);
  });

  it('should return paywall config with pricing', async () => {
    const request = new NextRequest('http://localhost/api/paywall/config?platform=web&country=US&plan=monthly');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.pricing).toBeDefined();
    expect(data.pricing.price_cents).toBe(999);
    expect(data.variant).toBeDefined();
    expect(data.config).toBeDefined();
  });

  it('should assign experiment variant', async () => {
    const request = new NextRequest('http://localhost/api/paywall/config?platform=web&country=US&plan=monthly&anon_id=test123');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.variant).toBeOneOf(['control', 'variant_a']);
    expect(data.experimentKey).toBe('exp_paywall_2025q4');
  });
});
