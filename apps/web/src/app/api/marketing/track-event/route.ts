import { trackConversion } from '@/lib/marketing/conversion-tracking';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, userId, properties, sessionId } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Missing required field: event' },
        { status: 400 }
      );
    }

    // Track conversion event
    trackConversion({
      userId,
      event,
      properties,
      sessionId,
      timestamp: new Date(),
    });

    // In production, also save to database
    // await prisma.conversionEvent.create({
    //   data: {
    //     userId,
    //     sessionId,
    //     eventName: event,
    //     eventType: getEventType(event),
    //     properties: properties || {},
    //     source: properties?.source || 'unknown',
    //     revenue: properties?.revenue || null,
    //   },
    // });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Event tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getEventType(event: string): string {
  if (event.includes('signup') || event.includes('upgrade')) {
    return 'conversion';
  }
  if (event.includes('page_view') || event.includes('view')) {
    return 'page_view';
  }
  if (event.includes('feature_use') || event.includes('click')) {
    return 'feature_use';
  }
  return 'other';
}

export const dynamic = "force-dynamic";
