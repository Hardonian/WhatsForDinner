import { GuardianGPT } from '@whats-for-dinner/utils/guardian';

// Get current user's Guardian instance
async function getGuardian(userId: string): Promise<Guardian> {
  return new Guardian(userId, './guardian/logs');
}

// GET /api/guardian/events - Get recent events
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // week, month, all

    const inspector = new GuardianInspector('./guardian/logs');
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        periodStart = new Date(0); // All time
    }

    const report = await inspector.analyzeAndGenerateReport(user.id, periodStart, now);

    return NextResponse.json({
      report,
      period,
    });
  } catch (error) {
    // Error handled: Guardian API error:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/guardian/explain - Ask Guardian GPT to explain
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { question, eventId, periodStart, periodEnd } = body;

    const explainer = new GuardianGPT('./guardian/logs');
    const explanation = await explainer.explain({
      question,
      userId: user.id,
      context: {
        eventId,
        periodStart: periodStart ? new Date(periodStart) : undefined,
        periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      },
    });

    return NextResponse.json({ explanation });
  } catch (error) {
    // Error handled: Guardian explain error:
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
