import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const checkoutSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  price: z.number().positive(),
});

async function handler(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    const body = await req.json();
    const { productId, productName, price } = checkoutSchema.parse(body);

    // Create Stripe Payment Link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId || 'anonymous',
        productId,
      },
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${req.nextUrl.origin}/marketplace/success?product_id=${productId}`,
        },
      },
    });

    return NextResponse.json({
      checkoutUrl: paymentLink.url,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout link' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
