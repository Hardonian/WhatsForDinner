import { handleError } from '@/lib/errors';

async function handler(req: NextRequest) {
  try {
    const supabase = await createClient();
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

    if (profile?.role !== 'owner' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '7', 10);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get signups
    const { data: signups } = await supabase
      .from('profiles')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString());

    // Get activations (users who created a meal plan)
    const { data: activations } = await supabase
      .from('analytics_events')
      .select('user_id, timestamp, properties')
      .eq('event_type', 'meal_plan_created')
      .gte('timestamp', startDate.toISOString());

    const activatedUserIds = new Set(activations?.map(a => a.user_id) || []);

    // Calculate activation times
    const activationTimes: number[] = [];
    for (const signup of signups || []) {
      const userActivations = activations?.filter(a => a.user_id === signup.id) || [];
      if (userActivations.length > 0) {
        const firstActivation = userActivations[0];
        const signupTime = new Date(signup.created_at).getTime();
        const activationTime = new Date(firstActivation.timestamp).getTime();
        activationTimes.push(activationTime - signupTime);
      }
    }

    const avgTimeToActivation = activationTimes.length > 0
      ? activationTimes.reduce((a, b) => a + b, 0) / activationTimes.length / 1000 / 60
      : 0;

    // Analyze funnel dropoff
    const { data: funnelEvents } = await supabase
      .from('funnel_events')
      .select('funnel_stage, user_id')
      .gte('created_at', startDate.toISOString());

    const stageCounts: Record<string, number> = {};
    funnelEvents?.forEach(event => {
      stageCounts[event.funnel_stage] = (stageCounts[event.funnel_stage] || 0) + 1;
    });

    const dropoffPoints = Object.entries(stageCounts).map(([stage, count]) => ({
      stage,
      count,
      percentage: signups ? (count / signups.length) * 100 : 0,
    })).sort((a, b) => b.percentage - a.percentage);

    // Get A/B test results
    const { data: abTests } = await supabase
      .from('ab_test_assignments')
      .select(`
        experiment_id,
        variant_id,
        user_id,
        ab_test_experiments(name),
        ab_test_variants(name)
      `)
      .gte('created_at', startDate.toISOString());

    // Calculate activation rates by A/B test variant
    const testResults: Record<string, Record<string, { assigned: number; activated: number; rate: number }>> = {};

    abTests?.forEach(assignment => {
      const expName = (assignment.ab_test_experiments as any)?.name || 'unknown';
      const variantName = (assignment.ab_test_variants as any)?.name || 'unknown';
      
      if (!testResults[expName]) {
        testResults[expName] = {};
      }
      if (!testResults[expName][variantName]) {
        testResults[expName][variantName] = { assigned: 0, activated: 0, rate: 0 };
      }
      
      testResults[expName][variantName].assigned++;
      if (activatedUserIds.has(assignment.user_id)) {
        testResults[expName][variantName].activated++;
      }
    });

    // Calculate rates
    Object.keys(testResults).forEach(exp => {
      Object.keys(testResults[exp]).forEach(variant => {
        const data = testResults[exp][variant];
        data.rate = data.assigned > 0 ? (data.activated / data.assigned) * 100 : 0;
      });
    });

    const metrics = {
      period: {
        days,
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
      signups: signups?.length || 0,
      activations: activatedUserIds.size,
      activationRate: signups && signups.length > 0
        ? (activatedUserIds.size / signups.length) * 100
        : 0,
      avgTimeToActivation: Math.round(avgTimeToActivation * 10) / 10,
      dropoffPoints,
      abTestResults: testResults,
    };

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(
      { success: false, error: appError.message },
      { status: 500 }
    );
  }
}

export const GET = handler;

export const dynamic = "force-dynamic";
