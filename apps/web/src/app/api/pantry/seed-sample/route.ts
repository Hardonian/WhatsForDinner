import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authData.user.id;

    const { data: existing } = await supabase
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        message: 'Sample data already seeded',
        count: existing.length,
      });
    }

    await supabase.from('pantry_items').insert([
      { user_id: userId, name: 'Eggs', quantity: 12 },
      { user_id: userId, name: 'Milk', quantity: 1 },
      { user_id: userId, name: 'Bread', quantity: 1 },
    ]);

    return NextResponse.json({
      message: 'Sample pantry seeded successfully',
      count: 3,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() { return NextResponse.json({ status: 'ok', stub: true }); }
