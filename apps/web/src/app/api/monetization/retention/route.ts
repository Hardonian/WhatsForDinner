import { handleApiError } from '@whats-for-dinner/utils/api-error-handler';

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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'churn-risk') {
      const churnRisk = await retentionMonetization.identifyChurnRisk(
        user.id,
        profile.tenant_id
      );
      return NextResponse.json(churnRisk);
    }

    if (action === 'loyalty') {
      const loyaltyReward = await retentionMonetization.generateLoyaltyRewards(
        user.id,
        profile.tenant_id
      );
      return NextResponse.json({ reward: loyaltyReward });
    }

    const retentionOffer = await retentionMonetization.generateRetentionOffer(
      user.id,
      profile.tenant_id
    );

    return NextResponse.json({ offer: retentionOffer });
  } catch (error) {
    return handleApiError(error, 'Failed to get retention offer');
  }
}

export const dynamic = "force-dynamic";
