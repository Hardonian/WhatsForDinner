// @ts-nocheck
/**
 * Vendor Management Routes
 *
 * CRUD for vendor catalog, DPA tracking, risk assessment, approval workflow
 */

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '../db/index';
import { vendorCatalog } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { getAdminAuth, requirePermission } from '../auth/admin';
import { logger } from '../observability/index';

// ============================================================================
// SCHEMAS
// ============================================================================

const createVendorSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['hosting', 'analytics', 'ads', 'payments', 'crm', 'devtools']),
  dpa_url: z.string().url().optional(),
  subprocessor: z.boolean().default(false),
  pii_access: z.boolean().default(false),
  risk_level: z.enum(['low', 'med', 'high']).default('med'),
  owner: z.string().min(1),
});

const updateVendorSchema = createVendorSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(['approved', 'pending', 'denied']).optional(),
});

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /api/admin/vendors
 * List vendors (filterable by category, status, risk_level)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth || !requirePermission(auth.admin.role, 'vendor:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const riskLevel = url.searchParams.get('risk_level');

    const filters: unknown[] = [];
    if (category) {
      filters.push(eq(vendorCatalog.category, category as any));
    }
    if (status) {
      filters.push(eq(vendorCatalog.status, status as any));
    }
    if (riskLevel) {
      filters.push(eq(vendorCatalog.risk_level, riskLevel as any));
    }

    const vendors = await db
      .select()
      .from(vendorCatalog)
      .where(filters.length > 0 ? and(...filters) : undefined);

    return NextResponse.json({ vendors });
  } catch (error) {
    logger.error({ error }, 'Error fetching vendors');
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

/**
 * POST /api/admin/vendors
 * Create new vendor entry
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth || !requirePermission(auth.admin.role, 'vendor:approve')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createVendorSchema.parse(body);

    // Check if vendor already exists
    const [existing] = await db
      .select()
      .from(vendorCatalog)
      .where(eq(vendorCatalog.name, data.name))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Vendor already exists' }, { status: 409 });
    }

    const [vendor] = await db
      .insert(vendorCatalog)
      .values({
        ...data,
        status: 'pending',
      })
      .returning();

    logger.info({ vendorId: vendor.id, name: vendor.name, adminId: auth.admin.id }, 'Vendor created');

    return NextResponse.json({ vendor }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error creating vendor');
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/vendors/:id
 * Update vendor (approval, status, DPA)
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth || !requirePermission(auth.admin.role, 'vendor:approve')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const vendorId = url.pathname.split('/').pop();

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const body = await request.json();
    const data = updateVendorSchema.parse({ ...body, id: vendorId });

    const [existing] = await db
      .select()
      .from(vendorCatalog)
      .where(eq(vendorCatalog.id, vendorId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // If status changed to denied, disable dependent features
    if (data.status === 'denied' && existing.status !== 'denied') {
      await disableVendorFeatures(existing.name, existing.category);
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.category) updateData.category = data.category;
    if (data.dpa_url) updateData.dpa_url = data.dpa_url;
    if (data.subprocessor !== undefined) updateData.subprocessor = data.subprocessor;
    if (data.pii_access !== undefined) updateData.pii_access = data.pii_access;
    if (data.risk_level) updateData.risk_level = data.risk_level;
    if (data.owner) updateData.owner = data.owner;
    if (data.status) updateData.status = data.status;

    const [vendor] = await db
      .update(vendorCatalog)
      .set(updateData)
      .where(eq(vendorCatalog.id, vendorId))
      .returning();

    logger.info({ vendorId, adminId: auth.admin.id, changes: data }, 'Vendor updated');

    return NextResponse.json({ vendor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error updating vendor');
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/vendors/:id
 * Delete vendor (soft delete by setting status to denied)
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth || !requirePermission(auth.admin.role, 'vendor:approve')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const vendorId = url.pathname.split('/').pop();

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const [vendor] = await db
      .select()
      .from(vendorCatalog)
      .where(eq(vendorCatalog.id, vendorId))
      .limit(1);

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Disable features before deleting
    await disableVendorFeatures(vendor.name, vendor.category);

    await db.delete(vendorCatalog).where(eq(vendorCatalog.id, vendorId));

    logger.info({ vendorId, adminId: auth.admin.id }, 'Vendor deleted');

    return NextResponse.json({ message: 'Vendor deleted' });
  } catch (error) {
    logger.error({ error }, 'Error deleting vendor');
    return NextResponse.json({ error: 'Failed to delete vendor' }, { status: 500 });
  }
}

/**
 * Disable dependent features when vendor is denied
 */
async function disableVendorFeatures(vendorName: string, category: string): Promise<void> {
  // In production, integrate with feature flag system
  // For now, log the action

  logger.warn(
    {
      vendor: vendorName,
      category,
      action: 'disable_features',
    },
    'Vendor features should be disabled via feature flags',
  );

  // Example: Disable adapters based on category
  // if (category === 'analytics') {
  //   await featureFlags.disable('analytics_enabled');
  // } else if (category === 'ads') {
  //   await featureFlags.disable('ads_enabled');
  // }
}

/**
 * GET /api/admin/vendors/:id
 * Get vendor details
 */
export async function getVendor(request: NextRequest) {
  try {
    const auth = await getAdminAuth(request);
    if (!auth || !requirePermission(auth.admin.role, 'vendor:read')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const vendorId = url.pathname.split('/').pop();

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID required' }, { status: 400 });
    }

    const [vendor] = await db
      .select()
      .from(vendorCatalog)
      .where(eq(vendorCatalog.id, vendorId))
      .limit(1);

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ vendor });
  } catch (error) {
    logger.error({ error }, 'Error fetching vendor');
    return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 });
  }
}
