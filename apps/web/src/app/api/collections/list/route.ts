import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('recipe_collections')
      .select('*, creator:profiles(name)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: collections, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
    }

    // Format response
    const formatted = (collections || []).map((col: any) => ({
      id: col.id,
      name: col.name,
      description: col.description,
      creator: col.creator?.name || 'Anonymous',
      price: col.price,
      recipeCount: col.recipe_count,
      rating: col.rating || 4.5,
      reviews: col.review_count || 0,
      category: col.category,
      createdAt: col.created_at,
    }));

    return NextResponse.json({ collections: formatted });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export const GET = withTelemetry(handler);

export const dynamic = "force-dynamic";
