import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const storeId = searchParams.get('store');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Query parameter required' },
        { status: 400 }
      );
    }

    await groceryManager.initialize();

    if (storeId) {
      const store = groceryManager.getStore(storeId);
      if (!store) {
        return NextResponse.json(
          { success: false, error: 'Store not found' },
          { status: 404 }
        );
      }

      const result = await store.searchProducts({
        query,
        category: category || undefined,
        limit,
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // Search all stores
    const results = await groceryManager.searchAllStores({
      query,
      category: category || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: Object.fromEntries(results),
    });
  } catch (error) {
    logger.error('Grocery search API error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to search products' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
