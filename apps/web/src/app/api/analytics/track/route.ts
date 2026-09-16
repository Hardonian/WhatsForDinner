import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('analytics-track-api');

const TrackEventSchema = z.object({
  event: z.string().min(1).max(100),
  properties: z.record(z.any()).optional().default({}),
  userId: z.string().optional(),
  anonymousId: z.string().optional(),
  timestamp: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    const parseResult = TrackEventSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { event, properties, userId, anonymousId, timestamp } = parseResult.data;
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const enrichedEvent = {
      event,
      properties: {
        ...properties,
        clientIp: clientIp.split(',')[0].trim(),
        userAgent,
      },
      userId: userId || null,
      anonymousId: anonymousId || req.cookies.get('wfd_anon_id')?.value || 'anon',
      timestamp: timestamp || new Date().toISOString(),
    };

    // System Logging & Telemetry
    _logger.info(`[Telemetry] ${event}`, enrichedEvent);

    // If PostHog or external analytics service is configured via environment
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (posthogKey) {
      try {
        await fetch(`${posthogHost}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: posthogKey,
            event,
            properties: enrichedEvent.properties,
            distinct_id: userId || enrichedEvent.anonymousId,
            timestamp: enrichedEvent.timestamp,
          }),
          signal: AbortSignal.timeout(2000), // Non-blocking fast timeout
        });
      } catch (err) {
        // PostHog delivery failed silently, internal telemetry is preserved
        _logger.debug('PostHog capture forward failed', { error: err instanceof Error ? err.message : String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      event,
      receivedAt: enrichedEvent.timestamp,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    _logger.error('Analytics tracking error', { error: message });
    return NextResponse.json(
      { error: 'Failed to process tracking event' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'telemetry-tracking-api',
    supportedEvents: [
      'onboarding_started',
      'pantry_scanned',
      'preferences_selected',
      'first_meal_generated',
      'cart_exported',
      'trial_activated',
      'checkout_initiated',
    ],
  });
}

export const dynamic = "force-dynamic";
