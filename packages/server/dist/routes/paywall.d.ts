/**
 * Paywall API Route
 * Server-driven paywall configuration with A/B testing
 * Returns pricing, active offers, and variant assignment
 */
import type { NextRequest } from 'next/server';
/**
 * GET /api/paywall/config
 * Get paywall configuration with pricing, offers, and variant
 */
export declare function GET(request: NextRequest): Promise<any>;
/**
 * POST /api/paywall/impression
 * Track paywall impression (client-side)
 */
export declare function POST_IMPRESSION(request: NextRequest): Promise<any>;
/**
 * POST /api/paywall/cta
 * Track paywall CTA click
 */
export declare function POST_CTA(request: NextRequest): Promise<any>;
//# sourceMappingURL=paywall.d.ts.map