/**
 * DSAR (Data Subject Access Request) Routes
 *
 * Self-serve portal for data export, erasure, rectification, and restriction
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
/**
 * POST /api/privacy/dsar
 * Create a new DSAR request
 */
export declare function POST(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    request_id: any;
    status: any;
    window_deadline: any;
    message: string;
}>>;
/**
 * POST /api/privacy/verify
 * Verify email and transition request to verifying/in_progress
 */
export declare function verifyDSAR(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    request_id: any;
    status: any;
    message: string;
}>>;
/**
 * GET /api/privacy/requests/me
 * List current user's DSAR requests
 */
export declare function getMyDSARs(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    requests: any;
}>>;
/**
 * POST /api/privacy/fulfill
 * Admin endpoint to fulfill DSAR and attach artifacts
 */
export declare function fulfillDSAR(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    request_id: any;
    status: any;
    completed_at: any;
}>>;
/**
 * POST /api/privacy/erase
 * Schedule erasure job (respects legal hold)
 */
export declare function eraseDSAR(request: NextRequest): Promise<NextResponse<{
    error: string;
}> | NextResponse<{
    request_id: any;
    status: any;
    message: string;
}>>;
//# sourceMappingURL=privacy.dsar.d.ts.map