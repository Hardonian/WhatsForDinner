import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createClient();

    // Aggregate user behavior data (anonymized)
    const { data: userData } = await supabase
      .from('user_engagement')
      .select('login_frequency, feature_usage, avg_session_duration, days_active')
      .limit(10000);

    const aggregated = {
      avgLoginFrequency: userData?.reduce((sum, u) => sum + (u.login_frequency || 0), 0) / (userData?.length || 1),
      avgSessionDuration: userData?.reduce((sum, u) => sum + (u.avg_session_duration || 0), 0) / (userData?.length || 1),
      avgDaysActive: userData?.reduce((sum, u) => sum + (u.days_active || 0), 0) / (userData?.length || 1),
      totalUsers: userData?.length || 0,
      timestamp: new Date().toISOString(),
    };

    // Store anonymized data
    await supabase.from('anonymized_data').insert({
      data_type: 'user_behavior',
      anonymized_data: aggregated,
    });

    return NextResponse.json({
      success: true,
      aggregated: true,
      sampleSize: userData?.length || 0,
    });
  } catch (error) {
    logger.error('Data aggregation error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to aggregate data' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
