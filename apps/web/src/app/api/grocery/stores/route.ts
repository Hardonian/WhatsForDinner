import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await groceryManager.initialize();
    const stores = groceryManager.getStores();
    const config = groceryManager.getConfig();

    return NextResponse.json({
      success: true,
      data: {
        stores,
        config,
      },
    });
  } catch (error) {
    logger.error('Grocery stores API error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to load stores' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
