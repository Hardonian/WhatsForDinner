import { createClient } from '@/lib/supabase/server';

// GET /api/nomad/mealplan - Get meal plans
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const week = searchParams.get('week'); // ISO week string
    const familyId = searchParams.get('family_id');

    let query = supabase
      .from('meal_plans')
      .select('*, meals(*)')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (week) {
      const startDate = new Date(week);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);

      query = query
        .gte('date', startDate.toISOString())
        .lt('date', endDate.toISOString());
    }

    if (familyId) {
      query = query.eq('family_id', familyId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ mealPlans: data || [] });
  } catch (error) {
    // Error handled: Error fetching meal plans:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/nomad/mealplan - Create meal plan
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, mealType, recipeId, recipeName, calories, familyId } = body;

    // Create meal plan entry
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .insert({
        user_id: user.id,
        family_id: familyId || null,
        date: date,
        meal_type: mealType, // breakfast, lunch, dinner, snack
        recipe_id: recipeId || null,
        recipe_name: recipeName || 'Custom Meal',
        calories: calories || null,
      })
      .select()
      .single();

    if (mealPlanError) {
      return NextResponse.json({ error: mealPlanError.message }, { status: 500 });
    }

    return NextResponse.json({ mealPlan }, { status: 201 });
  } catch (error) {
    // Error handled: Error creating meal plan:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/nomad/mealplan - Delete meal plan
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mealPlanId = searchParams.get('id');

    if (!mealPlanId) {
      return NextResponse.json({ error: 'Meal plan ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', mealPlanId)
      .eq('user_id', user.id); // Ensure user owns this meal plan

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Error handled: Error deleting meal plan:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
