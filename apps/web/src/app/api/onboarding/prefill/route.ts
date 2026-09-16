import { withTelemetry } from '@/lib/telemetry/api-middleware';

async function handler(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { generate_meal_plan } = await request.json().catch(() => ({}));

    // Step 1: Pre-fill pantry (call pantry seed-sample API)
    const pantryResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/pantry/seed-sample`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
      }
    );

    if (!pantryResponse.ok) {
      const pantryData = await pantryResponse.json();
      // If already seeded, that's fine
      if (!pantryData.message?.includes('already seeded')) {
        throw new Error('Failed to pre-fill pantry');
      }
    }

    // Step 2: Optionally generate first meal plan
    let mealPlanGenerated = false;
    if (generate_meal_plan) {
      try {
        const mealPlanResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/meal-plan/generate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: request.headers.get('cookie') || '',
            },
            body: JSON.stringify({
              use_pantry: true,
              servings: 1, // Default to solo
            }),
          }
        );

        if (mealPlanResponse.ok) {
          mealPlanGenerated = true;
        }
      } catch (error) {
        logger.warn('Failed to generate meal plan:', { error });
        // Don't fail if meal plan generation fails
      }
    }

    // Track onboarding completion
    await supabase
      .from('events')
      .insert({
        user_id: user.id,
        event_name: 'onboarding_prefill_completed',
        occurred_at: new Date().toISOString(),
        props: {
          meal_plan_generated: mealPlanGenerated,
          source: 'onboarding',
        },
      });

    // Update onboarding state
    await supabase
      .from('onboarding_state')
      .upsert({
        user_id: user.id,
        pantry_prefilled: true,
        first_meal_plan_generated: mealPlanGenerated,
        onboarding_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      pantry_prefilled: true,
      meal_plan_generated: mealPlanGenerated,
      message: mealPlanGenerated
        ? 'Pantry pre-filled and first meal plan generated!'
        : 'Pantry pre-filled! Ready to generate your first meal plan.',
      next_step: mealPlanGenerated ? 'explore_app' : 'generate_meal_plan',
    });
  } catch (error) {
    logger.error('Pre-fill onboarding error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to pre-fill onboarding' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
