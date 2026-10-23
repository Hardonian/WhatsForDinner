/**
 * Vendor Management Routes
 *
 * CRUD for vendor catalog, DPA tracking, risk assessment, approval workflow
 */
import type { NextRequest } from 'next/server';
/**
 * GET /api/admin/vendors
 * List vendors (filterable by category, status, risk_level)
 */
export declare function GET(request: NextRequest): Promise<any>;
/**
 * POST /api/admin/vendors
 * Create new vendor entry
 */
export declare function POST(request: NextRequest): Promise<any>;
/**
 * PUT /api/admin/vendors/:id
 * Update vendor (approval, status, DPA)
 */
export declare function PUT(request: NextRequest): Promise<any>;
/**
 * DELETE /api/admin/vendors/:id
 * Delete vendor (soft delete by setting status to denied)
 */
export declare function DELETE(request: NextRequest): Promise<any>;
/**
 * GET /api/admin/vendors/:id
 * Get vendor details
 */
export declare function getVendor(request: NextRequest): Promise<any>;
//# sourceMappingURL=vendors.d.ts.map