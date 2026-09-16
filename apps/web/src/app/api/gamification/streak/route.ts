import { withTelemetry } from '@/lib/telemetry/api-middleware';

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action'); // 'get' or 'update'

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    if (action === 'update') {
      const streak = await updateStreak(userId);
      return NextResponse.json(streak);
    } else {
      const streak = await getStreak(userId);
      return NextResponse.json(streak);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get streak' },
      { status: 500 }
    );
  }
}

export const GET = withTelemetry(handler);

export const dynamic = "force-dynamic";
