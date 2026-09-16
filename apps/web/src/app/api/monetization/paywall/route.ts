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
    const page = searchParams.get('page') || 'unknown';
    const action = searchParams.get('action');
    const featureAttempted = searchParams.get('feature');

    const result = await freemiumConverter.shouldShowPaywall(user.id, profile.tenant_id, {
      page,
      action: action || undefined,
      featureAttempted: featureAttempted || undefined,
    });

    if (result.show && result.strategy) {
      await freemiumConverter.trackPaywallImpression(
        user.id,
        result.strategy.id,
        'usage-limit'
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'Failed to check paywall');
  }
}

export const dynamic = "force-dynamic";
