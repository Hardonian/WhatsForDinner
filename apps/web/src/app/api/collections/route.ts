import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('collections-api');

const CollectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  recipeIds: z.array(z.string().uuid()).default([]),
  isPublic: z.boolean().default(false),
});

/**
 * GET /api/collections
 * Get all collections for the current user
 */
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

    const { data: collections, error } = await supabase
      .from('recipe_collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      _logger.error('Error fetching collections', {
        error: error.message,
        userId: user.id,
        correlationId: getCorrelationId(request),
      });
      return handleApiError(error, {
        component: 'collections-api',
        context: { userId: user.id, correlationId: getCorrelationId(request) },
      });
    }

    return NextResponse.json({ collections: collections || [] });
  } catch (error) {
    return handleApiError(error, {
      component: 'collections-api',
      context: { correlationId: getCorrelationId(request) },
    });
  }
}

/**
 * POST /api/collections
 * Create a new collection
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const collectionData = CollectionSchema.parse(body);

    const { data: collection, error } = await supabase
      .from('recipe_collections')
      .insert({
        user_id: user.id,
        name: collectionData.name,
        description: collectionData.description,
        recipe_ids: collectionData.recipeIds,
        is_public: collectionData.isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      _logger.error('Error creating collection', {
        error: error.message,
        userId: user.id,
        correlationId: getCorrelationId(request),
      });
      return handleApiError(error, {
        component: 'collections-api',
        context: { userId: user.id, correlationId: getCorrelationId(request) },
      });
    }

    _logger.info('Collection created', {
      collectionId: collection.id,
      userId: user.id,
      correlationId: getCorrelationId(request),
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid collection data', details: error.errors },
        { status: 400 }
      );
    }
    
    return handleApiError(error, {
      component: 'collections-api',
      context: { correlationId: getCorrelationId(request) },
    });
  }
}

export const dynamic = "force-dynamic";
