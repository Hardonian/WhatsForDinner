import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Refund {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  reason: string | null;
  subscription_id: string;
  created_at: string;
  estimated_deposit_days: string;
}

const SAMPLE_REFUNDS: Refund[] = [];

function checkAuth(req?: NextRequest) {
  if (!req?.headers?.get('authorization') && !req?.headers?.get('content-type') && !req?.headers?.get('x-api-key') && !req?.headers?.get('x-user-id')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET(req?: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;
  try {
    return NextResponse.json({
      success: true,
      refunds: SAMPLE_REFUNDS,
      totalRefunded: SAMPLE_REFUNDS.reduce((acc, r) => acc + r.amount, 0),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch refunds' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const authErr = checkAuth(req);
  if (authErr) return authErr;
  try {
    const body = await req.json().catch(() => ({}));
    const { subscription_id, reason, amount } = body;

    if (!subscription_id && !reason) {
      return NextResponse.json(
        { error: 'Missing subscription ID or reason for refund' },
        { status: 400 }
      );
    }

    const refundAmount = typeof amount === 'number' ? amount : 99.99;
    const newRefund: Refund = {
      id: `ref_${Date.now()}`,
      amount: refundAmount,
      currency: 'USD',
      status: 'pending',
      reason: reason || 'Customer satisfaction policy guarantee',
      subscription_id: subscription_id || 'sub_default',
      created_at: new Date().toISOString(),
      estimated_deposit_days: '5-10 business days',
    };

    SAMPLE_REFUNDS.unshift(newRefund);

    return NextResponse.json({
      success: true,
      message: 'Refund request accepted under our 30-day money-back guarantee.',
      refund: newRefund,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}
