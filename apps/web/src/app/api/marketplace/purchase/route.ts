import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const purchaseSchema = z.object({
  packId: z.string().optional(),
  creditPack: z.enum(['10', '25', '50']).optional(),
  type: z.enum(['recipe_pack', 'credits']),
});

async function handler(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { packId, creditPack, type } = purchaseSchema.parse(body);

    let priceId: string;
    let productName: string;

    if (type === 'recipe_pack' && packId) {
      // Get pack price from database or hardcode for now
      const packPrices: Record<string, { price: number; name: string }> = {
        'quick-easy': { price: 499, name: 'Quick & Easy Meals' },
        'meal-prep': { price: 699, name: 'Meal Prep Master' },
        'international': { price: 799, name: 'International Cuisine' },
        'kid-friendly': { price: 599, name: 'Kid-Friendly Favorites' },
      };

      const pack = packPrices[packId];
      if (!pack) {
        return NextResponse.json({ error: 'Invalid pack' }, { status: 400 });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: pack.name,
                description: 'Premium recipe pack',
              },
              unit_amount: pack.price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.nextUrl.origin}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.nextUrl.origin}/marketplace`,
        metadata: {
          userId,
          packId,
          type: 'recipe_pack',
        },
      });

      return NextResponse.json({ checkoutUrl: session.url });
    } else if (type === 'credits' && creditPack) {
      const creditPacks: Record<string, { price: number; credits: number }> = {
        '10': { price: 299, credits: 10 },
        '25': { price: 599, credits: 25 },
        '50': { price: 999, credits: 50 },
      };

      const pack = creditPacks[creditPack];
      if (!pack) {
        return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${pack.credits} Recipe Customization Credits`,
                description: 'Customize recipes with AI',
              },
              unit_amount: pack.price,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.nextUrl.origin}/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.nextUrl.origin}/marketplace`,
        metadata: {
          userId,
          creditPack: pack.credits.toString(),
          type: 'credits',
        },
      });

      return NextResponse.json({ checkoutUrl: session.url });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
