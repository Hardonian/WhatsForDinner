import { getKPIDashboard, getKPIsNeedingAttention } from '@/lib/monitoring/kpi-tracker';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') as 'daily' | 'weekly' | 'monthly') || 'daily';

    const dashboard = await getKPIDashboard(period);
    const needsAttention = await getKPIsNeedingAttention();

    return NextResponse.json({
      dashboard,
      needsAttention,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('KPI dashboard error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
