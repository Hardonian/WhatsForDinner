import { NextRequest, NextResponse } from 'next/server';
import { StripeService } from '@/lib/stripe';
import { createComponentLogger } from '@whats-for-dinner/utils';

const logger = createComponentLogger('subscription-portal-api');

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional
    }

    const userId = body.userId || req.headers.get('x-user-id') || req.headers.get('authorization');
    const tenantId = body.tenantId || req.headers.get('x-tenant-id') || undefined;

    if (!userId && !tenantId) {
      return NextResponse.json({ error: 'Unauthorized: User or Tenant ID required' }, { status: 401 });
    }

    const origin = req.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = body.returnUrl || `${origin}/settings`;

    logger.info('Creating customer portal session', { userId, tenantId, returnUrl });

    try {
      const session = await StripeService.createCustomerPortalSession({
        userId: userId || undefined,
        tenantId,
        returnUrl,
      });

      return NextResponse.json({
        success: true,
        url: session.url,
      });
    } catch (stripeErr: any) {
      logger.warn('Could not generate live portal session', { error: stripeErr?.message });
      // If Stripe test credentials or customer not yet created, return a graceful response
      return NextResponse.json(
        {
          error: stripeErr?.message || 'No active Stripe billing customer found for this account.',
          fallbackUrl: `${origin}/pricing`,
        },
        { status: 400 }
      );
    }
  } catch (err: any) {
    logger.error('Unexpected error in billing portal route', { error: err });
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
