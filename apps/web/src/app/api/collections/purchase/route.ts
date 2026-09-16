import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const purchaseSchema = z.object({
  collectionId: z.string(),
});

async function handler(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { collectionId } = purchaseSchema.parse(body);

    // Get collection
    const { data: collection } = await supabase
      .from('recipe_collections')
      .select('*')
      .eq('id', collectionId)
      .eq('status', 'active')
      .single();

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 });
    }

    // Check if already purchased
    const { data: existing } = await supabase
      .from('collection_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('collection_id', collectionId)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Already purchased' }, { status: 400 });
    }

    // Create Stripe checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: collection.name,
              description: collection.description,
            },
            unit_amount: Math.round(collection.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/collections/${collectionId}?purchased=true`,
      cancel_url: `${req.nextUrl.origin}/collections/${collectionId}`,
      metadata: {
        userId,
        collectionId,
        creatorId: collection.creator_id,
      },
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
