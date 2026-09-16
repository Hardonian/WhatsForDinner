// @ts-nocheck
/**
 * Payment Verification Routes
 * Handles iOS App Store and Android Play Store receipt validation
 */

import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '../auth/index';
import { addSecurityHeaders } from '../security/helmet';
import { logger } from '../observability/index';
import { verifyAppleReceipt } from '../payments/apple';
import { verifyGooglePurchase } from '../payments/google';

const verifyRequestSchema = z.object({
  platform: z.enum(['ios', 'android']),
  productId: z.string().optional(),
  transactionId: z.string().optional(),
  receipt: z.string().optional(), // iOS receipt
  purchaseToken: z.string().optional(), // Android purchase token
  purchaseTokens: z.array(z.string()).optional(), // Android restore
  action: z.enum(['purchase', 'restore']).optional().default('purchase'),
});

/**
 * POST /api/payments/verify
 * Verify purchase receipt from iOS or Android
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext(request);
    if (!auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = verifyRequestSchema.parse(body);

    let verificationResult;

    if (data.platform === 'ios') {
      if (!data.receipt) {
        return NextResponse.json({ error: 'Receipt required for iOS' }, { status: 400 });
      }

      verificationResult = await verifyAppleReceipt({
        receipt: data.receipt,
        transactionId: data.transactionId,
        productId: data.productId,
        userId: auth.userId,
      });
    } else if (data.platform === 'android') {
      if (data.action === 'restore' && data.purchaseTokens) {
        // Batch restore
        verificationResult = await Promise.all(
          data.purchaseTokens.map(token =>
            verifyGooglePurchase({
              purchaseToken: token,
              userId: auth.userId,
            })
          )
        );
      } else {
        if (!data.purchaseToken && !data.transactionId) {
          return NextResponse.json({ error: 'Purchase token or transaction ID required for Android' }, { status: 400 });
        }

        verificationResult = await verifyGooglePurchase({
          purchaseToken: data.purchaseToken || data.transactionId!,
          productId: data.productId,
          userId: auth.userId,
        });
      }
    } else {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
    }

    if (!verificationResult) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Store subscription status in database
    // This would typically update a subscriptions table
    // For now, we return the verification result

    let res = NextResponse.json({
      verified: true,
      subscription: verificationResult,
    }, { status: 200 });
    
    return addSecurityHeaders(res);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn({ error }, 'Invalid verification request');
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }

    logger.error({ error }, 'Payment verification error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
