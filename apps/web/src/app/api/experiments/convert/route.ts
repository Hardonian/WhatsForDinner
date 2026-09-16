import { z } from 'zod';

const ConversionSchema = z.object({
  experimentId: z.string(),
  eventName: z.string(),
  properties: z.record(z.any()).optional(),
});

/**
 * POST /api/experiments/convert
 * Tracks a conversion event for an experiment
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { experimentId, eventName, properties } =
      ConversionSchema.parse(body);

    // Get user ID if authenticated
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    let userId: string | undefined;

    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
      } catch {
        // Not authenticated, continue as anonymous
      }
    }

    // Track conversion
    await trackConversion(experimentId, eventName, userId, properties);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    // Error handled: Error tracking conversion:
    return NextResponse.json(
      { error: 'Failed to track conversion' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
