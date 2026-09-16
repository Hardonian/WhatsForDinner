import { successResponse } from '@/lib/api/response';

async function handler(_req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Rate limiting
    const rateLimitResult = await withRateLimit(_req, {
      window: 60, // 1 minute
      max: 30, // 30 requests per minute
      keyGenerator: (req) => {
        const userId = req.headers.get('x-user-id');
        return userId || req.headers.get('x-forwarded-for') || 'unknown';
      },
    });

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    const { createClient } = await import('@/lib/supabase/server');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'owner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Import Stripe
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-12-18.acacia',
    });

    // Get subscription revenue from Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: 'all',
      limit: 100,
    });

    const activeSubscriptions = subscriptions.data.filter(s => s.status === 'active');
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      const amount = sub.items.data[0]?.price.unit_amount || 0;
      return sum + (amount / 100); // Convert cents to dollars
    }, 0);

    // Get total revenue from Stripe (last 30 days)
    const thirtyDaysAgo = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const charges = await stripe.charges.list({
      created: { gte: thirtyDaysAgo },
      limit: 100,
    });
    const totalRevenue = charges.data.reduce((sum, charge) => sum + (charge.amount / 100), 0);

    // Get user counts from database (optimized with caching)
    const totalUsers = await optimizedQuery(
      async () => {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        return count || 0;
      },
      {
        cacheKey: `dashboard:totalUsers:${user.id}`,
        cacheTTL: 300, // 5 minutes
        tags: ['dashboard', 'users'],
      }
    );

    const activeUsers = await optimizedQuery(
      async () => {
        const { count } = await supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        return count || 0;
      },
      {
        cacheKey: `dashboard:activeUsers:${user.id}`,
        cacheTTL: 300,
        tags: ['dashboard', 'subscriptions'],
      }
    );

    // Calculate ARPU
    const arpu = totalUsers && totalUsers > 0 ? mrr / totalUsers : 0;

    // Get churn rate (cancelled subscriptions in last 30 days)
    const cancelledSubs = subscriptions.data.filter(
      s => s.status === 'canceled' && s.canceled_at && s.canceled_at >= thirtyDaysAgo
    );
    const churnRate = activeSubscriptions.length > 0
      ? (cancelledSubs.length / activeSubscriptions.length) * 100
      : 0;

    // Calculate LTV (ARPU * average lifespan in months)
    // Assuming 12 month average lifespan based on unit economics
    const ltv = arpu * 12;

    // Get affiliate revenue
    const { data: affiliateConversions } = await supabase
      .from('affiliate_conversions')
      .select('amount, commission')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const affiliateRevenue = affiliateConversions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const affiliateCommissions = affiliateConversions?.reduce((sum, c) => sum + (c.commission || 0), 0) || 0;

    // Get API monetization revenue
    const { data: apiUsage } = await supabase
      .from('api_access_keys')
      .select('usage_count, tier')
      .gte('last_used_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const apiRevenue = apiUsage?.reduce((sum, key) => {
      // Estimate revenue based on tier and usage
      const tierPricing: Record<string, number> = {
        basic: 0.01, // $0.01 per 1000 requests
        pro: 0.005,
        enterprise: 0.002,
      };
      return sum + ((key.usage_count || 0) * (tierPricing[key.tier as string] || 0.01));
    }, 0) || 0;

    // Get upsell opportunities
    const { data: upsellData } = await supabase
      .from('subscriptions')
      .select('plan, user_id')
      .eq('status', 'active')
      .eq('plan', 'pro');

    const upsellOpportunities = upsellData?.length || 0;

    // Get engagement metrics
    const { data: recentActivity } = await supabase
      .from('analytics_events')
      .select('event_type')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const engagementScore = recentActivity?.length || 0;

    const dashboard = {
      summary: {
        totalRevenue: totalRevenue + affiliateRevenue + apiRevenue,
        mrr,
        arpu: arpu.toFixed(2),
        ltv: ltv.toFixed(2),
        churnRate: churnRate.toFixed(2),
        activeUsers: activeUsers || 0,
        totalUsers: totalUsers || 0,
      },
      revenueBreakdown: {
        subscriptions: totalRevenue,
        affiliate: affiliateRevenue,
        api: apiRevenue,
        affiliateCommissions,
      },
      optimizations: {
        pricing: revenueOptimizer.findUpsellOpportunities(
          'pro',
          [
            { id: 'free', name: 'Free', price: 0, features: [], value: 0, margin: 0 },
            { id: 'pro', name: 'Pro', price: 9.99, features: [], value: 50, margin: 86 },
            { id: 'family', name: 'Family', price: 19.99, features: [], value: 80, margin: 86 },
          ],
          {},
          50
        ),
        subscriptions: [],
        advertising: [],
        passiveIncome: [
          { source: 'Affiliate Program', revenue: affiliateRevenue, potential: affiliateRevenue * 2 },
          { source: 'API Monetization', revenue: apiRevenue, potential: apiRevenue * 3 },
        ],
      },
      recommendations: {
        upsells: upsellOpportunities > 0 ? [
          {
            type: 'tier_upgrade',
            count: upsellOpportunities,
            potentialRevenue: upsellOpportunities * 10, // $10 ARPU increase
            message: `${upsellOpportunities} Pro users could upgrade to Family`,
          },
        ] : [],
        scaling: [],
        roi: [],
      },
      metrics: {
        engagement: [
          { metric: '7-day active users', value: engagementScore },
          { metric: 'Monthly active users', value: activeUsers || 0 },
        ],
        roi: [
          { metric: 'LTV/CAC Ratio', value: ltv > 0 && 30 > 0 ? (ltv / 30).toFixed(2) : '0' },
          { metric: 'Payback Period (months)', value: arpu > 0 ? (30 / arpu).toFixed(1) : '0' },
        ],
        adPerformance: [],
      },
    };

    // Track performance
    const duration = Date.now() - startTime;
    performanceMonitor.trackEndpoint('/api/revenue/dashboard', duration, 200);

    return NextResponse.json(successResponse(dashboard));
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.trackEndpoint('/api/revenue/dashboard', duration, 500);
    performanceMonitor.trackError('revenue_dashboard_error', '/api/revenue/dashboard');

    const appError = handleError(error);
    const statusCode = getErrorStatusCode(appError);
    const message = getUserFriendlyMessage(appError);
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: appError.code,
          message,
          ...(process.env.NODE_ENV === 'development' && { details: appError.details }),
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: statusCode }
    );
  }
}

export const GET = withTelemetry(handler);

export const dynamic = "force-dynamic";
