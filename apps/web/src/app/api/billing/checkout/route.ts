import { analytics } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, successUrl, cancelUrl } = await request.json();

    if (!plan || !successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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

    // Create checkout session
    const session = await StripeService.createCheckoutSession({
      tenantId: profile.tenant_id,
      userId: user.id,
      plan,
      successUrl,
      cancelUrl,
    });

    // Track checkout initiation
    await analytics.trackEvent('checkout_initiated', {
      user_id: user.id,
      tenant_id: profile.tenant_id,
      plan,
      session_id: session.id,
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    // Error handled: Checkout error:
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
