import { handleError, getErrorStatusCode, getUserFriendlyMessage } from '@/lib/errors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const customizeSchema = z.object({
  recipeId: z.string(),
  customizations: z.object({
    vegetarian: z.boolean().optional(),
    spiceLevel: z.number().min(1).max(5).optional(),
    proteinLevel: z.number().min(1).max(5).optional(),
    kidFriendly: z.boolean().optional(),
  }),
});

async function handler(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipeId, customizations } = customizeSchema.parse(body);

    // Check user plan and credits
    const { data: user } = await supabase
      .from('profiles')
      .select('plan, credits')
      .eq('id', userId)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if Pro or has credits
    const isPro = user.plan === 'pro' || user.plan === 'family';
    const hasCredits = (user.credits || 0) > 0;

    if (!isPro && !hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits. Upgrade to Pro or purchase credits.' },
        { status: 403 }
      );
    }

    // Deduct credit if not Pro
    if (!isPro && hasCredits) {
      await supabase.rpc('decrement_user_credits', {
        user_id_param: userId,
        credits_param: 1,
      });
    }

    // Get original recipe
    const { data: recipe } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // TODO: Call AI service to customize recipe
    // For now, return modified recipe structure
    const customizedRecipe = {
      ...recipe,
      title: `${recipe.title} (Customized)`,
      customizations,
      customized_at: new Date().toISOString(),
    };

    // Save customized recipe
    const { data: savedRecipe } = await supabase
      .from('recipes')
      .insert({
        ...customizedRecipe,
        user_id: userId,
        original_recipe_id: recipeId,
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      customizedRecipe: savedRecipe,
      creditsRemaining: isPro ? null : (user.credits || 0) - 1,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    const appError = handleError(error);
    const statusCode = getErrorStatusCode(appError);
    const message = getUserFriendlyMessage(appError);

    return NextResponse.json(
      { error: message, code: appError.code },
      { status: statusCode }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
