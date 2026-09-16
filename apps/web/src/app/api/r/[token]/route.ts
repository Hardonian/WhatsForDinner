import crypto from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const signedUrl = request.nextUrl.searchParams.get('url');

    let linkData;
    
    if (signedUrl) {
      linkData = await verifySignedUrl(signedUrl);
    } else {
      // In production, lookup token -> signed_url mapping from Redis/DB
      return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
    }

    if (!linkData) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    // Get user context
    const userId = request.headers.get('x-user-id') || null;
    const anonId = request.cookies.get('anon_id')?.value || crypto.randomUUID();
    const consent = request.cookies.get('consent')?.value === 'true';

    // Get geo and UA info
    const country = request.geo?.country || 
                   request.headers.get('cf-ipcountry') ||
                   request.headers.get('x-vercel-ip-country') || 
                   'US';
    
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               '';

    // Hash sensitive data
    const uaHash = crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16);
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);

    const campaignId = linkData.meta?.campaign_id as string | undefined;

    // Log click
    await db.insert(clicks).values({
      user_id: userId || null,
      anon_id: anonId,
      partner_id: linkData.partner_id,
      campaign_id: campaignId || null,
      sku: linkData.sku || null,
      source: 'redirect',
      country,
      ua_hash: uaHash,
      ip_hash: ipHash,
      consent,
      signature: crypto.randomBytes(16).toString('hex'),
    }).catch((error) => {
      // Error handled: Failed to log click
    });

    // Get partner for attribution window
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, linkData.partner_id))
      .limit(1);

    const attributionWindowDays = partner?.attribution_window_days || 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + attributionWindowDays);

    // Build redirect response
    const redirectResponse = NextResponse.redirect(linkData.destination, 302);

    // Set attribution cookie
    redirectResponse.cookies.set('partner_attribution', JSON.stringify({
      partner_id: linkData.partner_id,
      sku: linkData.sku,
      timestamp: Date.now(),
      expires_at: expiresAt.getTime(),
    }), {
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Set anon_id if not present
    if (!request.cookies.get('anon_id')) {
      redirectResponse.cookies.set('anon_id', anonId, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }

    return redirectResponse;
  } catch (error) {
    // Error handled: Redirect handler error
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
