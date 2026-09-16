import { z } from 'zod';

const PreferencesSchema = z.object({
  diets: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  cooking_skill: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  custom_preferences: z.string().optional(),
});

/**
 * GET /api/preferences
 * Returns user's dietary preferences
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

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return NextResponse.json(data || {
      diets: [],
      allergies: [],
      cooking_skill: null,
      custom_preferences: null,
    });
  } catch (error) {
    // Error handled: Error fetching preferences:
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences
 * Creates or updates user's dietary preferences
 */
export async function POST(req: Request) {
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

    const body = await req.json();
    const preferences = PreferencesSchema.parse(body);

    // Upsert preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update onboarding state
    if (preferences.diets || preferences.allergies || preferences.cooking_skill) {
      await supabase
        .from('onboarding_state')
        .upsert({
          user_id: user.id,
          preferences_set: true,
          updated_at: new Date().toISOString(),
        });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Error handled: Error updating preferences:
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
