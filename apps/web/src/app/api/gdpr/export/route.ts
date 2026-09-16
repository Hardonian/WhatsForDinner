import { logger } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Export all user data
    const [userData, recipes, preferences, analytics] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('recipes').select('*').eq('user_id', userId),
      supabase.from('user_preferences').select('*').eq('user_id', userId),
      supabase.from('analytics_events').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      user: userData.data,
      recipes: recipes.data,
      preferences: preferences.data,
      analytics: analytics.data,
      exportedAt: new Date().toISOString(),
    };

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="user-data-export-${userId}.json"`,
      },
    });
  } catch (error) {
    logger.error('GDPR export failed', { error });
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
