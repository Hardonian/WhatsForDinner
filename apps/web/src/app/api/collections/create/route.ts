import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const collectionSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  recipeIds: z.array(z.string()).min(1),
  price: z.number().min(0.99).max(99.99),
  category: z.string().optional(),
});

async function handler(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, recipeIds, price, category } = collectionSchema.parse(body);

    // Create collection
    const { data: collection } = await supabase
      .from('recipe_collections')
      .insert({
        creator_id: userId,
        name,
        description,
        recipe_ids: recipeIds,
        price,
        category,
        status: 'pending_review', // Review before going live
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      collection,
      message: 'Collection created. Pending review.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
