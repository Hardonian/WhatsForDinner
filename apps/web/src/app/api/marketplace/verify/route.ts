import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = session.metadata?.userId;
    const packId = session.metadata?.packId;
    const creditPack = session.metadata?.creditPack;
    const type = session.metadata?.type as 'recipe_pack' | 'credits';

    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 400 });
    }

    // Check if already processed
    const { data: existing } = await supabase
      .from('marketplace_purchases')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        type,
        message: 'Already processed',
      });
    }

    // Record purchase
    if (type === 'recipe_pack' && packId) {
      await supabase.from('marketplace_purchases').insert({
        user_id: userId,
        stripe_session_id: sessionId,
        purchase_type: 'recipe_pack',
        pack_id: packId,
        status: 'completed',
      });

      // Unlock pack for user
      await supabase.from('user_recipe_packs').insert({
        user_id: userId,
        pack_id: packId,
        unlocked_at: new Date().toISOString(),
      });
    } else if (type === 'credits' && creditPack) {
      await supabase.from('marketplace_purchases').insert({
        user_id: userId,
        stripe_session_id: sessionId,
        purchase_type: 'credits',
        credits_amount: parseInt(creditPack),
        status: 'completed',
      });

      // Add credits to user account
      await supabase.rpc('increment_user_credits', {
        user_id_param: userId,
        credits_param: parseInt(creditPack),
      });
    }

    return NextResponse.json({
      success: true,
      type,
      message: 'Purchase verified and content unlocked',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to verify purchase' },
      { status: 500 }
    );
  }
}

export const GET = withTelemetry(handler);

export const dynamic = "force-dynamic";
