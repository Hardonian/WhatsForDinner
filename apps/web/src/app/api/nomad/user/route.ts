import { createClient } from '@/lib/supabase/server';

// GET /api/nomad/user - Get user profile and preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile with preferences
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Fetch dietary preferences
    const { data: preferences } = await supabase
      .from('user_dietary_preferences')
      .select('preference')
      .eq('user_id', user.id);

    // Fetch allergens
    const { data: allergens } = await supabase
      .from('user_allergens')
      .select('allergen')
      .eq('user_id', user.id);

    // Fetch health goals
    const { data: goals } = await supabase
      .from('user_health_goals')
      .select('goal')
      .eq('user_id', user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profile || null,
      preferences: preferences?.map((p) => p.preference) || [],
      allergens: allergens?.map((a) => a.allergen) || [],
      goals: goals?.map((g) => g.goal) || [],
    });
  } catch (error) {
    // Error handled: Error fetching user:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/nomad/user - Create or update user profile
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { preferences, allergens, goals, householdSize, theme, notifications } = body;

    // Upsert user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        household_size: householdSize || 1,
        theme_preference: theme || 'light',
        notifications_enabled: notifications !== undefined ? notifications : true,
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Update preferences
    if (preferences && Array.isArray(preferences)) {
      // Delete existing
      await supabase
        .from('user_dietary_preferences')
        .delete()
        .eq('user_id', user.id);

      // Insert new
      if (preferences.length > 0) {
        await supabase
          .from('user_dietary_preferences')
          .insert(
            preferences.map((pref: string) => ({
              user_id: user.id,
              preference: pref,
            }))
          );
      }
    }

    // Update allergens
    if (allergens && Array.isArray(allergens)) {
      await supabase
        .from('user_allergens')
        .delete()
        .eq('user_id', user.id);

      if (allergens.length > 0) {
        await supabase
          .from('user_allergens')
          .insert(
            allergens.map((allergen: string) => ({
              user_id: user.id,
              allergen,
            }))
          );
      }
    }

    // Update goals
    if (goals && Array.isArray(goals)) {
      await supabase
        .from('user_health_goals')
        .delete()
        .eq('user_id', user.id);

      if (goals.length > 0) {
        await supabase
          .from('user_health_goals')
          .insert(
            goals.map((goal: string) => ({
              user_id: user.id,
              goal,
            }))
          );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error handled: Error updating user:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
