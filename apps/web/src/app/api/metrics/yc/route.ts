import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Active Users (DAU/WAU/MAU)
    const { data: activeUsers, error: activeUsersError } = await supabase.rpc(
      'get_active_users',
      {
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
      }
    );

    // Get Activation Rate
    const { data: activation, error: activationError } = await supabase.rpc(
      'get_activation_rate'
    );

    // Get Retention Rate
    const { data: retention, error: retentionError } = await supabase.rpc(
      'get_retention_rate',
      {
        cohort_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cohort_end: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }
    );

    // Get Conversion Funnel
    const { data: funnel, error: funnelError } = await supabase.rpc(
      'get_conversion_funnel',
      {
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
      }
    );

    // Get Revenue Metrics
    const { data: revenue, error: revenueError } = await supabase.rpc(
      'get_revenue_metrics'
    );

    // Get Unit Economics
    const { data: unitEconomics, error: unitEconomicsError } = await supabase.rpc(
      'get_unit_economics'
    );

    // Get Channel Metrics
    const { data: channels, error: channelsError } = await supabase.rpc(
      'get_channel_metrics',
      {
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString(),
      }
    );

    // Handle errors gracefully
    if (activeUsersError) console.error('Active users error:', activeUsersError);
    if (activationError) console.error('Activation error:', activationError);
    if (retentionError) console.error('Retention error:', retentionError);
    if (funnelError) console.error('Funnel error:', funnelError);
    if (revenueError) console.error('Revenue error:', revenueError);
    if (unitEconomicsError) console.error('Unit economics error:', unitEconomicsError);
    if (channelsError) console.error('Channels error:', channelsError);

    // Format response
    const response = {
      activeUsers: activeUsers || [],
      activation: activation && activation.length > 0 ? activation[0] : null,
      retention: retention && retention.length > 0 ? retention[0] : null,
      funnel: funnel && funnel.length > 0 ? funnel[0] : null,
      revenue: revenue && revenue.length > 0 ? revenue[0] : null,
      unitEconomics: unitEconomics && unitEconomics.length > 0 ? unitEconomics[0] : null,
      channels: channels || [],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('YC Metrics API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
