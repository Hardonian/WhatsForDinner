import { withTelemetry } from '@/lib/telemetry/api-middleware';

async function handler(request: NextRequest) {
  try {
    const { affiliateCode, referralId, productId } = await request.json();

    if (!affiliateCode) {
      return NextResponse.json({ error: 'Missing affiliate code' }, { status: 400 });
    }

    const supabase = createClient();

    // Get affiliate info
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, user_id, commission_rate')
      .eq('affiliate_code', affiliateCode)
      .eq('status', 'active')
      .single();

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 404 });
    }

    // Track click
    const { data: click, error } = await supabase
      .from('affiliate_clicks')
      .insert({
        affiliate_id: affiliate.id,
        referral_id: referralId,
        product_id: productId,
        clicked_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Set cookie for conversion tracking (30 days)
    const cookieDuration = parseInt(process.env.AFFILIATE_COOKIE_DURATION || '30');
    const response = NextResponse.json({ success: true, clickId: click.id });
    response.cookies.set('affiliate_code', affiliateCode, {
      maxAge: cookieDuration * 24 * 60 * 60,
      httpOnly: false, // Need to read in client
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    logger.error('Affiliate tracking error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
