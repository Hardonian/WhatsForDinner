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
    const targetTier = searchParams.get('tier');

    if (targetTier) {
      const offer = await dynamicPricing.generatePricingOffer(
        user.id,
        profile.tenant_id,
        targetTier
      );
      if (offer) {
        await dynamicPricing.trackPricingOffer(offer);
      }
      return NextResponse.json({ offer });
    }

    const optimalPricing = await dynamicPricing.getOptimalPricing(
      user.id,
      profile.tenant_id
    );

    return NextResponse.json(optimalPricing);
  } catch (error) {
    return handleApiError(error, 'Failed to get pricing');
  }
}

export const dynamic = "force-dynamic";
