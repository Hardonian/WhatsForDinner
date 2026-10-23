/**
 * Partner Conversion Webhook Handler
 *
 * Handles conversion webhooks from partners (server-to-server)
 * Idempotent by order_id, HMAC signed, respects attribution windows
 */
import type { NextRequest } from 'next/server';
/**
 * POST /api/partner/convert
 * Record a conversion (HMAC signed, idempotent)
 */
export declare function POST(request: NextRequest): Promise<any>;
//# sourceMappingURL=partnerConvert.d.ts.map