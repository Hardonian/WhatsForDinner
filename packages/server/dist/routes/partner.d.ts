/**
 * Partner API Routes
 *
 * Handles partner authentication, catalog sync, campaigns, links, reports
 */
import type { NextRequest } from 'next/server';
/**
 * POST /api/partner/auth/token (admin only)
 * Mint a partner JWT token
 */
export declare function POST_AUTH_TOKEN(request: NextRequest): Promise<any>;
/**
 * POST /api/partner/catalog/sync
 * Trigger catalog sync for a feed
 */
export declare function POST_CATALOG_SYNC(request: NextRequest): Promise<any>;
/**
 * POST /api/partner/campaigns
 * Create a new campaign
 */
export declare function POST_CAMPAIGNS(request: NextRequest): Promise<any>;
/**
 * GET /api/partner/campaigns
 * List campaigns
 */
export declare function GET_CAMPAIGNS(request: NextRequest): Promise<any>;
/**
 * POST /api/partner/links
 * Create a signed partner link
 */
export declare function POST_LINKS(request: NextRequest): Promise<any>;
/**
 * GET /api/partner/reports/summary
 * Get summary reports (impressions, clicks, conversions, spend, ROAS)
 */
export declare function GET_REPORTS_SUMMARY(request: NextRequest): Promise<any>;
/**
 * GET /api/partner/payouts
 * List payout statements
 */
export declare function GET_PAYOUTS(request: NextRequest): Promise<any>;
//# sourceMappingURL=partner.d.ts.map