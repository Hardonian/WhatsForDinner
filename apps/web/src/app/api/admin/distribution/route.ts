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

    // Get users by channel (UTM source)
    const { data: users } = await supabase
      .from('users')
      .select('id, utm_source, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Get subscriptions by channel
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('user_id, status, plan')
      .eq('status', 'active')
      .in('user_id', users?.map((u) => u.id) || []);

    // Group by channel
    const channels = ['organic', 'referral', 'social', 'paid', 'direct'];
    const channelMetrics = channels.map((channel) => {
      const channelUsers = users?.filter((u) => u.utm_source === channel || (!u.utm_source && channel === 'direct')) || [];
      const channelSubscriptions = subscriptions?.filter((s) =>
        channelUsers.some((u) => u.id === s.user_id)
      ) || [];

      const signups = channelUsers.length;
      const conversions = channelSubscriptions.length;
      const conversionRate = signups > 0 ? (conversions / signups) * 100 : 0;

      // Calculate CAC (simplified - would need actual ad spend data)
      const cac = channel === 'organic' || channel === 'referral' ? 0 : channel === 'social' ? 10 : 30;

      // Calculate LTV (simplified)
      const arpu = channelSubscriptions.reduce((sum, s) => {
        return sum + (s.plan === 'pro' ? 9.99 : s.plan === 'premium' ? 19.99 : 0);
      }, 0) / (conversions || 1);
      const ltv = arpu * 12; // Assume 12 months average

      return {
        channel,
        signups,
        conversions,
        conversionRate: Math.round(conversionRate * 10) / 10,
        cac: Math.round(cac * 100) / 100,
        ltv: Math.round(ltv * 100) / 100,
      };
    });

    return NextResponse.json({ channels: channelMetrics });
  } catch (error: any) {
    console.error('Error fetching distribution metrics:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch distribution metrics' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
