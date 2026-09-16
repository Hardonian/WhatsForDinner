import { engagementScorer } from '@/lib/revenue/engagement-scoring';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's current tier and usage
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const currentTier = subscription?.plan_id || 'free';

    // Get user engagement metrics
    const { data: metrics } = await supabase
      .from('user_engagement')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!metrics) {
      return NextResponse.json({ opportunities: [] });
    }

    // Calculate engagement score
    const engagementMetrics = {
      userId: user.id,
      loginFrequency: metrics.login_frequency || 0,
      featureUsage: metrics.feature_usage || {},
      sessionDuration: metrics.avg_session_duration || 0,
      contentConsumption: metrics.content_views || 0,
      socialInteractions: metrics.social_interactions || 0,
      purchases: metrics.purchase_count || 0,
      lastActivity: new Date(metrics.last_activity || Date.now()),
      daysActive: metrics.days_active || 0,
    };

    const engagementScore = engagementScorer.calculateScore(engagementMetrics);

    // Get available tiers
    const { data: tiers } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });

    // Find upsell opportunities
    const opportunities = revenueOptimizer.findUpsellOpportunities(
      currentTier,
      tiers || [],
      engagementMetrics.featureUsage,
      engagementScore.score
    );

    return NextResponse.json({
      opportunities,
      engagementScore: engagementScore.score,
      monetizationPotential: engagementScore.monetizationPotential,
    });
  } catch (error) {
    logger.error('Upsell opportunities error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to find opportunities' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
