import { headers } from 'next/headers';

/**
 * GET /api/onboarding/checklist
 * Returns user's onboarding checklist state
 */
export async function GET(req: Request) {
  try {
    const headersList = await headers();
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get onboarding state
    const { data: onboardingState } = await supabase
      .from('onboarding_state')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Check pantry items
    const { data: pantryItems } = await supabase
      .from('pantry_items')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    // Check saved recipes
    const { data: favorites } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    const checklist = {
      generate_recipe: onboardingState?.first_recipe_generated || false,
      add_pantry: (pantryItems?.length || 0) > 0,
      set_preferences: onboardingState?.preferences_set || false,
      save_recipe: (favorites?.length || 0) > 0,
      checklist_completed: onboardingState?.checklist_completed || false,
    };

    return NextResponse.json(checklist);
  } catch (error) {
    // Error handled: Error fetching checklist:
    return NextResponse.json(
      { error: 'Failed to fetch checklist' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
