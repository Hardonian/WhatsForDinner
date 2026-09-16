import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const purchaseSchema = z.object({
  creditPack: z.enum(['10', '25', '50', '200']),
});

async function handler(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { creditPack } = purchaseSchema.parse(body);

    const creditPacks: Record<string, { price: number; credits: number }> = {
      '10': { price: 499, credits: 10 },
      '25': { price: 999, credits: 25 },
      '50': { price: 1999, credits: 50 },
      '200': { price: 6999, credits: 200 },
    };

    const pack = creditPacks[creditPack];
    if (!pack) {
      return NextResponse.json({ error: 'Invalid credit pack' }, { status: 400 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pack.credits} Recipe Credits`,
              description: 'Pay-per-use recipe generation and customization credits',
            },
            unit_amount: pack.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.nextUrl.origin}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.nextUrl.origin}/credits`,
      metadata: {
        userId,
        creditPack: pack.credits.toString(),
        type: 'credits',
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
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
