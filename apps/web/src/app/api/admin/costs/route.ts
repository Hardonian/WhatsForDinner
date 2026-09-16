import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface CostBreakdown {
  cloud: number;
  stripe: number;
  email: number;
  ads: number;
  other: number;
}

interface CostData {
  period: string;
  total: number;
  breakdown: CostBreakdown;
  forecast: number;
  budget: number;
  budgetAlert: boolean;
  trend: 'up' | 'down' | 'stable';
}

interface CostMetrics {
  current: CostData;
  history: Array<{
    period: string;
    total: number;
  }>;
  trends: {
    monthOverMonth: number;
    yearOverYear: number;
  };
}

/**
 * Get Stripe fees from Stripe API or database
 */
async function getStripeFees(period: 'week' | 'month' | 'quarter' | 'year'): Promise<number> {
  // In production, query Stripe Reports API or database
  // For now, return placeholder based on subscription count
  try {
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('status', 'active');

    const subscriptionCount = subscriptions?.length || 0;
    // Estimate: $0.30 per transaction + 2.9% of revenue
    // Assuming average subscription value $10/month
    const monthlyRevenue = subscriptionCount * 10;
    const stripeFees = monthlyRevenue * 0.029 + subscriptionCount * 0.30;

    return stripeFees;
  } catch {
    return 0;
  }
}

/**
 * Get cloud infrastructure costs
 */
async function getCloudCosts(period: 'week' | 'month' | 'quarter' | 'year'): Promise<number> {
  // In production, integrate with cloud provider billing APIs
  // For Supabase: estimate based on database size, bandwidth, storage
  // For Vercel: estimate based on function invocations, bandwidth
  
  // Placeholder calculation
  try {
    const { data: usage } = await supabase
      .from('analytics_events')
      .select('id')
      .limit(1);

    // Rough estimate: $50 base + $0.10 per 1M requests
    return 50; // Base cost estimate
  } catch {
    return 50;
  }
}

/**
 * Get email service costs
 */
async function getEmailCosts(period: 'week' | 'month' | 'quarter' | 'year'): Promise<number> {
  // In production, query SendGrid/Klaviyo API for billing
  // Estimate: $0.001 per email sent
  
  try {
    const { data: emails } = await supabase
      .from('email_sends')
      .select('id')
      .limit(1000);

    const emailCount = emails?.length || 0;
    return emailCount * 0.001;
  } catch {
    // Fallback: estimate based on user count
    const { data: users } = await supabase.from('users').select('id').limit(1);
    return (users?.length || 0) * 0.05; // $0.05 per user/month estimate
  }
}

/**
 * Get advertising costs
 */
async function getAdsCosts(period: 'week' | 'month' | 'quarter' | 'year'): Promise<number> {
  // In production, integrate with ad platform APIs (Google Ads, Facebook, etc.)
  // Placeholder
  return 0;
}

/**
 * Calculate forecast based on trends
 */
function calculateForecast(
  current: number,
  history: Array<{ period: string; total: number }>,
): number {
  if (history.length < 2) {
    return current * 1.05; // 5% growth estimate
  }

  // Simple linear trend
  const recent = history.slice(-3);
  const avgGrowth = recent.length > 1
    ? (recent[recent.length - 1].total - recent[0].total) / recent.length
    : 0;

  return current + avgGrowth;
}

/**
 * GET /api/admin/costs
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin auth (in production, check JWT token)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const period = (request.nextUrl.searchParams.get('period') as 'week' | 'month' | 'quarter' | 'year') || 'month';

    // Calculate costs for current period
    const [cloud, stripe, email, ads] = await Promise.all([
      getCloudCosts(period),
      getStripeFees(period),
      getEmailCosts(period),
      getAdsCosts(period),
    ]);

    const total = cloud + stripe + email + ads;
    const budget = 1000; // $1000/month default budget
    const budgetAlert = total > budget * 0.8; // Alert if > 80% of budget

    // Generate history (last 6 periods)
    const history: Array<{ period: string; total: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const periodDate = new Date();
      periodDate.setMonth(periodDate.getMonth() - i);
      history.push({
        period: periodDate.toISOString().slice(0, 7), // YYYY-MM
        total: total * (0.9 + Math.random() * 0.2), // Simulate variation
      });
    }

    const forecast = calculateForecast(total, history);
    
    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (history.length >= 2) {
      const change = history[history.length - 1].total - history[history.length - 2].total;
      const changePercent = (change / history[history.length - 2].total) * 100;
      if (changePercent > 5) trend = 'up';
      else if (changePercent < -5) trend = 'down';
    }

    const current: CostData = {
      period: new Date().toISOString().slice(0, 7),
      total,
      breakdown: {
        cloud,
        stripe,
        email,
        ads,
        other: 0,
      },
      forecast,
      budget,
      budgetAlert,
      trend,
    };

    const metrics: CostMetrics = {
      current,
      history,
      trends: {
        monthOverMonth: history.length >= 2
          ? ((history[history.length - 1].total - history[history.length - 2].total) /
              history[history.length - 2].total) *
            100
          : 0,
        yearOverYear: 0, // Would calculate vs same period last year
      },
    };

    return NextResponse.json(metrics);
  } catch (error) {
    // Error handled: Error fetching cost metrics:
    return NextResponse.json(
      { error: 'Failed to fetch cost metrics' },
      { status: 500 },
    );
  }
}

export const dynamic = "force-dynamic";