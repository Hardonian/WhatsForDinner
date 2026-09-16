import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get date ranges
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Calculate DAU/WAU/MAU using distinct user counts
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: dauData, count: dauCount } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact' })
      .gte('timestamp', todayStart.toISOString())
      .not('user_id', 'is', null);

    const { data: wauData, count: wauCount } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact' })
      .gte('timestamp', weekAgo.toISOString())
      .not('user_id', 'is', null);

    const { data: mauData, count: mauCount } = await supabase
      .from('analytics_events')
      .select('user_id', { count: 'exact' })
      .gte('timestamp', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .not('user_id', 'is', null);

    // Get distinct user counts
    const dau = new Set(dauData?.map((d) => d.user_id) || []).size;
    const wau = new Set(wauData?.map((d) => d.user_id) || []).size;
    const mau = new Set(mauData?.map((d) => d.user_id) || []).size;

    // Calculate growth rate (WoW)
    const { data: currentWeekUsers } = await supabase
      .from('analytics_events')
      .select('user_id')
      .gte('timestamp', weekAgo.toISOString());

    const { data: previousWeekUsers } = await supabase
      .from('analytics_events')
      .select('user_id')
      .gte('timestamp', twoWeeksAgo.toISOString())
      .lt('timestamp', weekAgo.toISOString());

    const currentWeekCount = new Set(currentWeekUsers?.map((u) => u.user_id) || []).size;
    const previousWeekCount = new Set(previousWeekUsers?.map((u) => u.user_id) || []).size;
    const growthRate = previousWeekCount > 0 ? ((currentWeekCount - previousWeekCount) / previousWeekCount) * 100 : 0;

    // Calculate retention (7-day)
    const { data: signups } = await supabase
      .from('analytics_events')
      .select('user_id')
      .eq('event_type', 'user_signed_up')
      .gte('timestamp', weekAgo.toISOString());

    const { data: returnedUsers } = await supabase
      .from('analytics_events')
      .select('user_id')
      .in('user_id', signups?.map((s) => s.user_id) || [])
      .gte('timestamp', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .neq('event_type', 'user_signed_up');

    const signupCount = new Set(signups?.map((s) => s.user_id) || []).size;
    const returnedCount = new Set(returnedUsers?.map((u) => u.user_id) || []).size;
    const retention = signupCount > 0 ? (returnedCount / signupCount) * 100 : 0;

    // Calculate activation rate
    const { data: activatedUsers } = await supabase
      .from('recipe_metrics')
      .select('user_id')
      .in('user_id', signups?.map((s) => s.user_id) || [])
      .gte('generated_at', weekAgo.toISOString());

    const activatedCount = new Set(activatedUsers?.map((u) => u.user_id) || []).size;
    const activation = signupCount > 0 ? (activatedCount / signupCount) * 100 : 0;

    return NextResponse.json({
      growthRate: Math.round(growthRate * 10) / 10,
      retention: Math.round(retention * 10) / 10,
      activation: Math.round(activation * 10) / 10,
      dau: dau || 0,
      wau: wau || 0,
      mau: mau || 0,
    });
  } catch (error: any) {
    console.error('Error fetching traction metrics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch traction metrics' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
