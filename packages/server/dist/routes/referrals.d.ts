/**
 * Referrals API Routes
 * Handles referral code generation, tracking, and claiming
 * Idempotent operations with abuse prevention
 */
import type { NextRequest } from 'next/server';
/**
 * POST /api/referrals/programs
 * Create or update a referral program (admin only)
 */
export declare function POST_PROGRAMS(request: NextRequest): Promise<any>;
/**
 * POST /api/referrals/code
 * Generate a referral code for the current user (rate-limited)
 */
export declare function POST_CODE(request: NextRequest): Promise<any>;
/**
 * POST /api/referrals/track
 * Track a referral click (sets cookie/anon_id)
 * Idempotent - can be called multiple times
 */
export declare function POST_TRACK(request: NextRequest): Promise<any>;
/**
 * POST /api/referrals/claim
 * Claim a referral on signup or purchase
 * Applies promo offers if eligible
 */
export declare function POST_CLAIM(request: NextRequest): Promise<any>;
/**
 * GET /api/referrals/me
 * Get referral stats for current user
 */
export declare function GET_ME(request: NextRequest): Promise<any>;
//# sourceMappingURL=referrals.d.ts.map