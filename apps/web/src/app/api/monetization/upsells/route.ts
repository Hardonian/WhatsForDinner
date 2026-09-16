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

    const opportunities = await valueEngine.identifyUpsellOpportunities(
      user.id,
      profile.tenant_id
    );

    return NextResponse.json({ opportunities });
  } catch (error) {
    return handleApiError(error, 'Failed to get upsell opportunities');
  }
}

export const dynamic = "force-dynamic";
