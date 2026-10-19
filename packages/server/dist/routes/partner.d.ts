/**
 * Partner API Routes
 *
 * Handles partner authentication, catalog sync, campaigns, links, reports
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
/**
 * POST /api/partner/auth/token (admin only)
 * Mint a partner JWT token
 */
export declare function POST_AUTH_TOKEN(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    token: string;
}>>;
/**
 * POST /api/partner/catalog/sync
 * Trigger catalog sync for a feed
 */
export declare function POST_CATALOG_SYNC(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    synced: number;
    errors: number;
    total: number;
}>>;
/**
 * POST /api/partner/campaigns
 * Create a new campaign
 */
export declare function POST_CAMPAIGNS(request: NextRequest): Promise<NextResponse<any>>;
/**
 * GET /api/partner/campaigns
 * List campaigns
 */
export declare function GET_CAMPAIGNS(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    campaigns: any;
}>>;
/**
 * POST /api/partner/links
 * Create a signed partner link
 */
export declare function POST_LINKS(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<import("../partners/links").SignedLink>>;
/**
 * GET /api/partner/reports/summary
 * Get summary reports (impressions, clicks, conversions, spend, ROAS)
 */
export declare function GET_REPORTS_SUMMARY(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    period: {
        from: string;
        to: string;
    };
    clicks: number;
    conversions: number;
    revenue_cents: number;
    spend_cents: number;
    ctr: number;
    cvr: number;
    roas: number;
}>>;
/**
 * GET /api/partner/payouts
 * List payout statements
 */
export declare function GET_PAYOUTS(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    payouts: any;
}>>;
//# sourceMappingURL=partner.d.ts.map