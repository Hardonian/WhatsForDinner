import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const referralCode = body?.referralCode;
    const supabase = (createClient as any)();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: ref, error: refError } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .eq('reward_status', 'pending')
      .single();

    if (refError || !ref) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
    }

    if (ref.referrer_id === user.id) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
    }

    await supabase
      .from('referrals')
      .update({ invitee_id: user.id, reward_status: 'completed' })
      .eq('id', ref.id);

    return NextResponse.json({
      success: true,
      reward: {
        type: ref.reward_type,
        value: ref.reward_value,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ status: 'ok', stub: true }); }
