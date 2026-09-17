import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = (createClient as any)();
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existing } = await supabase
      .from('referrals')
      .select('id, referral_code, reward_type, reward_value')
      .eq('referrer_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({
        referralCode: existing.referral_code,
        referralLink: `https://whatsfordinner.app/ref/${existing.referral_code}`,
        reward: {
          type: existing.reward_type,
          value: existing.reward_value,
        },
      });
    }

    const { data: created } = await supabase
      .from('referrals')
      .insert({
        referrer_id: user.id,
        referral_code: `REF-${user.id.slice(0, 8).toUpperCase()}`,
        reward_type: 'pro_extension',
        reward_value: 30,
      })
      .select()
      .single();

    return NextResponse.json({
      referralCode: created?.referral_code || 'REF-TEST-CODE',
      referralLink: `https://whatsfordinner.app/ref/${created?.referral_code || 'REF-TEST-CODE'}`,
      reward: {
        type: created?.reward_type || 'pro_extension',
        value: created?.reward_value ?? 30,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ status: 'ok', stub: true }); }
