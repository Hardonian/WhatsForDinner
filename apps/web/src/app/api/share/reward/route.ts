import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const shareRewardSchema = z.object({
  recipeId: z.string(),
});

async function handler(req: NextRequest) {
  try {
    // Get user from auth
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { recipeId } = shareRewardSchema.parse(body);

    // Check if already rewarded for this recipe
    const { data: existing } = await supabase
      .from('share_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('recipe_id', recipeId)
      .single();

    if (existing) {
      return NextResponse.json({ 
        message: 'Already rewarded',
        credits: 0 
      });
    }

    // Award 1 Pro feature credit
    const { data: reward } = await supabase
      .from('share_rewards')
      .insert({
        user_id: userId,
        recipe_id: recipeId,
        credits_awarded: 1,
        reward_type: 'pro_feature',
      })
      .select()
      .single();

    // Update user credits
    await supabase.rpc('increment_user_credits', {
      user_id_param: userId,
      credits_param: 1,
    });

    return NextResponse.json({
      success: true,
      credits: 1,
      message: 'Reward credited!',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process reward' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
