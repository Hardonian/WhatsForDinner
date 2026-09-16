import { gamificationSystem } from '@/lib/gamification/system';

async function handler(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (req.method === 'GET') {
      const challenges = await gamificationSystem.getActiveChallenges(userId);
      return NextResponse.json({ challenges });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { challengeId, increment = 1 } = body;

      await gamificationSystem.updateChallengeProgress(userId, challengeId, increment);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process challenges' },
      { status: 500 }
    );
  }
}

export const GET = withTelemetry(handler);
export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
