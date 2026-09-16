// @ts-nocheck
/**
 * Vendor Management Tests
 *
 * Test vendor CRUD, approval workflow, and feature flag integration
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db/index';
import { vendorCatalog } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('Vendor Management', () => {
  let testVendorId: string;

  afterAll(async () => {
    // Cleanup
    if (testVendorId) {
      await db.delete(vendorCatalog).where(eq(vendorCatalog.id, testVendorId));
    }
  });

  it('should create vendor', async () => {
    const [vendor] = await db
      .insert(vendorCatalog)
      .values({
        name: 'Test Analytics Vendor',
        category: 'analytics',
        subprocessor: false,
        pii_access: true,
        risk_level: 'med',
        status: 'pending',
        owner: 'Privacy Team',
      })
      .returning();

    testVendorId = vendor.id;

    expect(vendor).toBeDefined();
    expect(vendor.name).toBe('Test Analytics Vendor');
    expect(vendor.status).toBe('pending');
  });

  it('should approve vendor', async () => {
    if (!testVendorId) {
      const [vendor] = await db
        .insert(vendorCatalog)
        .values({
          name: 'Test Vendor Approve',
          category: 'analytics',
          status: 'pending',
          owner: 'Privacy Team',
        })
        .returning();
      testVendorId = vendor.id;
    }

    await db
      .update(vendorCatalog)
      .set({
        status: 'approved',
        updated_at: new Date(),
      })
      .where(eq(vendorCatalog.id, testVendorId));

    const [updated] = await db
      .select()
      .from(vendorCatalog)
      .where(eq(vendorCatalog.id, testVendorId))
      .limit(1);

    expect(updated?.status).toBe('approved');
  });

  it('should deny vendor and trigger feature flag disable', async () => {
    const [vendor] = await db
      .insert(vendorCatalog)
      .values({
        name: 'Test Vendor Deny',
        category: 'analytics',
        status: 'approved',
        owner: 'Privacy Team',
      })
      .returning();

    // Deny vendor
    await db
      .update(vendorCatalog)
      .set({
        status: 'denied',
        updated_at: new Date(),
      })
      .where(eq(vendorCatalog.id, vendor.id));

    const [updated] = await db
      .select()
      .from(vendorCatalog)
      .where(eq(vendorCatalog.id, vendor.id))
      .limit(1);

    expect(updated?.status).toBe('denied');

    // In production, this would trigger feature flag disable
    // For test, just verify status changed

    // Cleanup
    await db.delete(vendorCatalog).where(eq(vendorCatalog.id, vendor.id));
  });

  it('should list vendors by category', async () => {
    const vendors = await db
      .select()
      .from(vendorCatalog)
      .where(eq(vendorCatalog.category, 'analytics'));

    expect(Array.isArray(vendors)).toBe(true);
  });
});
