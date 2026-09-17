import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await headers();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authData.user.id;

    const { data: state } = await supabase
      .from('onboarding_state')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: pantry } = await supabase
      .from('pantry_items')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: favorites } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    return NextResponse.json({
      generate_recipe: Boolean(state?.first_recipe_generated),
      add_pantry: (pantry && pantry.length > 0) || false,
      set_preferences: Boolean(state?.preferences_set),
      save_recipe: (favorites && favorites.length > 0) || false,
      checklist_completed: Boolean(state?.checklist_completed),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

export async function POST() { return NextResponse.json({ status: 'ok', stub: true }); }
