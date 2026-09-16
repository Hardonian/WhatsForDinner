import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Step 1: Signups
    const { data: signups } = await supabase
      .from('analytics_events')
      .select('user_id')
      .eq('event_type', 'user_signed_up')
      .gte('timestamp', thirtyDaysAgo);

    const signupCount = new Set(signups?.map((s) => s.user_id) || []).size;

    // Step 2: Added pantry
    const { data: pantryUsers } = await supabase
      .from('pantry_items')
      .select('user_id')
      .in('user_id', signups?.map((s) => s.user_id) || []);

    const pantryCount = new Set(pantryUsers?.map((p) => p.user_id) || []).size;
    const pantryConversionRate = signupCount > 0 ? (pantryCount / signupCount) * 100 : 0;
    const pantryDropOffRate = signupCount > 0 ? ((signupCount - pantryCount) / signupCount) * 100 : 0;

    // Step 3: Generated first recipe
    const { data: firstRecipeUsers } = await supabase
      .from('recipe_metrics')
      .select('user_id')
      .in('user_id', signups?.map((s) => s.user_id) || []);

    const firstRecipeCount = new Set(firstRecipeUsers?.map((r) => r.user_id) || []).size;
    const firstRecipeConversionRate = pantryCount > 0 ? (firstRecipeCount / pantryCount) * 100 : 0;
    const firstRecipeDropOffRate = pantryCount > 0 ? ((pantryCount - firstRecipeCount) / pantryCount) * 100 : 0;

    // Step 4: Generated 3+ recipes (engaged)
    const { data: engagedUsers } = await supabase
      .from('recipe_metrics')
      .select('user_id')
      .in('user_id', firstRecipeUsers?.map((r) => r.user_id) || []);

    const engagedCountMap = new Map<string, number>();
    engagedUsers?.forEach((r) => {
      engagedCountMap.set(r.user_id, (engagedCountMap.get(r.user_id) || 0) + 1);
    });
    const engagedCount = Array.from(engagedCountMap.values()).filter((count) => count >= 3).length;
    const engagedConversionRate = firstRecipeCount > 0 ? (engagedCount / firstRecipeCount) * 100 : 0;
    const engagedDropOffRate = firstRecipeCount > 0 ? ((firstRecipeCount - engagedCount) / firstRecipeCount) * 100 : 0;

    // Step 5: Upgraded to Pro (paying)
    const { data: payingUsers } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .in('user_id', engagedUsers?.map((r) => r.user_id) || []);

    const payingCount = new Set(payingUsers?.map((p) => p.user_id) || []).size;
    const payingConversionRate = engagedCount > 0 ? (payingCount / engagedCount) * 100 : 0;
    const payingDropOffRate = engagedCount > 0 ? ((engagedCount - payingCount) / engagedCount) * 100 : 0;

    const steps = [
      {
        step: 'Signups',
        count: signupCount,
        conversionRate: 100,
        dropOffRate: 0,
      },
      {
        step: 'Added Pantry',
        count: pantryCount,
        conversionRate: Math.round(pantryConversionRate * 10) / 10,
        dropOffRate: Math.round(pantryDropOffRate * 10) / 10,
      },
      {
        step: 'Generated First Recipe',
        count: firstRecipeCount,
        conversionRate: Math.round(firstRecipeConversionRate * 10) / 10,
        dropOffRate: Math.round(firstRecipeDropOffRate * 10) / 10,
      },
      {
        step: 'Generated 3+ Recipes (Engaged)',
        count: engagedCount,
        conversionRate: Math.round(engagedConversionRate * 10) / 10,
        dropOffRate: Math.round(engagedDropOffRate * 10) / 10,
      },
      {
        step: 'Upgraded to Pro (Paying)',
        count: payingCount,
        conversionRate: Math.round(payingConversionRate * 10) / 10,
        dropOffRate: Math.round(payingDropOffRate * 10) / 10,
      },
    ];

    return NextResponse.json({ steps });
  } catch (error: any) {
    console.error('Error fetching activation funnel:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch activation funnel' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
