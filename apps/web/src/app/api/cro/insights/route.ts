import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 404 });
    }

    const insights = await croOptimizer.getCROInsights(profile.tenant_id);
    const funnel = await croOptimizer.analyzeFunnel('main', '30d');

    return NextResponse.json({
      insights,
      funnel,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Error handled: Error getting CRO insights:
    return NextResponse.json(
      { error: 'Failed to get CRO insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ctaId, event, userId, metadata } = body;

    if (action === 'track_cta') {
      await croOptimizer.trackCTAInteraction(ctaId, event, userId, metadata);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    // Error handled: Error processing CRO request:
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
