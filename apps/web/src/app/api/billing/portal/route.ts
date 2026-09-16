import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { returnUrl } = await request.json();

    if (!returnUrl) {
      return NextResponse.json({ error: 'Missing returnUrl' }, { status: 400 });
    }

    // Get user's tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'No tenant found for user' },
        { status: 400 }
      );
    }

    // Create customer portal session
    const session = await StripeService.createCustomerPortalSession({
      tenantId: profile.tenant_id,
      userId: user.id,
      returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    // Error handled: Portal error:
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
