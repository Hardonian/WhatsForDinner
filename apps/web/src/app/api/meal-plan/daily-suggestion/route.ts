import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Generate daily suggestion based on user preferences or use default
    const suggestion = {
      id: `daily-${new Date().toISOString().split('T')[0]}`,
      title: 'Today\'s Featured Recipe',
      description: 'A delicious meal suggestion personalized just for you',
      imageUrl: '/images/daily-suggestion.jpg',
      cookTime: 30,
      servings: 4,
      difficulty: 'Easy',
      createdAt: new Date().toISOString(),
    };

    // If user is logged in, personalize based on their preferences
    if (user) {
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (preferences) {
        // Customize suggestion based on preferences
        suggestion.title = `Perfect ${preferences.cuisine_preference || 'meal'} for you`;
      }
    }

    return NextResponse.json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    logger.error('Daily suggestion API error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to load daily suggestion' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
