import { cookies } from 'next/headers';

const COOKIE_DURATION_DAYS = 90;

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const type = searchParams.get('type'); // 'ref', 'aff', 'partner'

    if (!code || !type) {
      return NextResponse.json({ error: 'Missing code or type' }, { status: 400 });
    }

    // Set attribution cookie
    const cookieStore = cookies();
    const cookieName = `program_${type}`;
    cookieStore.set(cookieName, code, {
      maxAge: COOKIE_DURATION_DAYS * 24 * 60 * 60,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    // Track click
    let programId: string | null = null;

    if (type === 'ref') {
      const { data } = await supabase
        .from('referrals')
        .select('id')
        .eq('referral_code', code)
        .single();
      programId = data?.id || null;
    } else if (type === 'aff') {
      const { data } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', code)
        .single();
      programId = data?.id || null;
    }

    if (programId) {
      await supabase.from('program_analytics').insert({
        program_type: type === 'ref' ? 'referral' : 'affiliate',
        program_id: programId,
        event_type: 'click',
        metadata: {
          user_agent: request.headers.get('user-agent'),
          referer: request.headers.get('referer'),
        },
      });
    }

    return NextResponse.json({ success: true, attributed: true });
  } catch (error) {
    logger.error('Attribution error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { user_id } = body;

    // Check for attribution cookies
    const cookieStore = cookies();
    const refCode = cookieStore.get('program_ref')?.value;
    const affCode = cookieStore.get('program_aff')?.value;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Process referral attribution
    if (refCode) {
      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_id')
        .eq('referral_code', refCode)
        .eq('status', 'pending')
        .single();

      if (referral && referral.referrer_id !== user_id) {
        await supabase
          .from('referrals')
          .update({
            referred_user_id: user_id,
            status: 'pending',
          })
          .eq('id', referral.id);

        // Clear cookie
        cookieStore.delete('program_ref');
      }
    }

    // Process affiliate attribution
    if (affCode) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', affCode)
        .eq('status', 'approved')
        .single();

      if (affiliate) {
        // Store attribution for when user subscribes
        await supabase.from('program_analytics').insert({
          program_type: 'affiliate',
          program_id: affiliate.id,
          event_type: 'signup',
          user_id,
          metadata: { attributed: true },
        });

        // Clear cookie
        cookieStore.delete('program_aff');
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Attribution processing error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
