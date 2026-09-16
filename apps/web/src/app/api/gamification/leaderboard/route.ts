import { gamificationSystem } from '@/lib/gamification/system';

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const leaderboard = await gamificationSystem.getLeaderboard(limit);
    return NextResponse.json({ leaderboard });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}

export const GET = withTelemetry(handler);

export const dynamic = "force-dynamic";
