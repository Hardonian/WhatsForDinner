import { createClient } from '@/lib/supabase/server';

// GET /api/nomad/recipes - Get recipe recommendations
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const preferences = searchParams.get('preferences')?.split(',') || [];
    const allergens = searchParams.get('allergens')?.split(',') || [];
    const limit = parseInt(searchParams.get('limit') || '10');
    const aiRecommended = searchParams.get('ai') === 'true';

    // If AI recommendations requested (Premium feature)
    if (aiRecommended) {
      // Call LLM service for personalized recommendations
      // This would integrate with OpenAI/Anthropic for recipe suggestions
      // For now, return filtered recipes from database
    }

    // Build query with filters
    let query = supabase
      .from('recipes')
      .select('*')
      .limit(limit);

    // Filter by preferences
    if (preferences.length > 0) {
      query = query.contains('tags', preferences);
    }

    // Exclude recipes with allergens
    if (allergens.length > 0) {
      query = query.not('allergens', 'cs', `{${allergens.join(',')}}`);
    }

    const { data: recipes, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If AI recommended, enrich with LLM suggestions
    if (aiRecommended && recipes) {
      // In production, this would call an AI service
      // For now, we'll just return the filtered results
    }

    return NextResponse.json({ recipes: recipes || [] });
  } catch (error) {
    // Error handled: Error fetching recipes:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/nomad/recipes/ai-recommend - AI-powered recipe recommendations (Premium)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has Premium subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!subscription || subscription.tier !== 'premium') {
      return NextResponse.json(
        { error: 'Premium subscription required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { pantryItems, preferences, dietaryRestrictions, healthGoals } = body;

    // Call AI service for personalized recommendations
    // This is a placeholder - in production, integrate with OpenAI/Anthropic
    const aiPrompt = `Generate personalized recipe recommendations based on:
- Available pantry items: ${pantryItems?.join(', ') || 'none'}
- Dietary preferences: ${preferences?.join(', ') || 'none'}
- Restrictions: ${dietaryRestrictions?.join(', ') || 'none'}
- Health goals: ${healthGoals?.join(', ') || 'none'}
`;

    // Mock AI response - replace with actual API call
    const aiRecipes = [
      {
        id: 'ai-1',
        title: 'AI Recommended: Mediterranean Quinoa Bowl',
        description: 'Perfect match for your preferences and pantry',
        cookTime: 25,
        difficulty: 'Easy',
        tags: ['healthy', 'quick', 'vegetarian'],
        aiMatchScore: 0.95,
      },
    ];

    return NextResponse.json({ recipes: aiRecipes });
  } catch (error) {
    // Error handled: Error generating AI recommendations:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
