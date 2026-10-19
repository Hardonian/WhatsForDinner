/**
 * Payment Verification Routes
 * Handles iOS App Store and Android Play Store receipt validation
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
/**
 * POST /api/payments/verify
 * Verify purchase receipt from iOS or Android
 */
export declare function POST(request: NextRequest): Promise<NextResponse<unknown>>;
//# sourceMappingURL=paymentsVerify.d.ts.map