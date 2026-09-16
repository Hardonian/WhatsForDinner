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

    if (action === 'credits') {
      const credits = await usagePremium.getUserCredits(user.id, profile.tenant_id);
      return NextResponse.json(credits);
    }

    if (action === 'recommendations') {
      const recommendations = await usagePremium.recommendFeatures(user.id, profile.tenant_id);
      return NextResponse.json({ recommendations });
    }

    const features = usagePremium.getAvailableFeatures();
    return NextResponse.json({ features });
  } catch (error) {
    return handleApiError(error, 'Failed to get premium features');
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { action, featureId, quantity } = body;

    if (action === 'purchase') {
      const result = await usagePremium.purchaseCredits(
        user.id,
        profile.tenant_id,
        featureId,
        quantity
      );
      return NextResponse.json(result);
    }

    if (action === 'use') {
      const result = await usagePremium.useCredits(
        user.id,
        profile.tenant_id,
        featureId,
        quantity
      );
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return handleApiError(error, 'Failed to process premium feature request');
  }
}

export const dynamic = "force-dynamic";
