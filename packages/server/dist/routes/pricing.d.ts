/**
 * Pricing API Routes
 * GET /api/pricing/current - Get current price recommendation
 * POST /api/pricing/survey - Submit Van Westendorp survey responses
 * GET /api/revenue/summary - Get revenue summary
 * GET /api/elasticity/:country/:plan - Get elasticity coefficients
 * POST /api/experiments/price - Start/stop price experiments
 */
import type { NextRequest } from 'next/server';
/**
 * GET /api/pricing/current
 * Returns current price recommendation with reason
 */
export declare function GET_CURRENT(request: NextRequest): Promise<any>;
/**
 * POST /api/pricing/survey
 * Accept Van Westendorp survey responses
 */
export declare function POST_SURVEY(request: NextRequest): Promise<any>;
/**
 * GET /api/revenue/summary
 * Get aggregated revenue snapshots (MRR, ARR, ARPU, churn)
 */
export declare function GET_REVENUE_SUMMARY(request: NextRequest): Promise<any>;
/**
 * GET /api/elasticity/:country/:plan
 * Get latest elasticity coefficients
 */
export declare function GET_ELASTICITY(request: NextRequest, params: {
    country: string;
    plan: string;
}): Promise<any>;
/**
 * POST /api/experiments/price
 * Start or stop price experiments
 */
export declare function POST_PRICE_EXPERIMENT(request: NextRequest): Promise<any>;
//# sourceMappingURL=pricing.d.ts.map