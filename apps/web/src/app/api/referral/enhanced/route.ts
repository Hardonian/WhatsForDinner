import { handleApiError } from '@whats-for-dinner/utils/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const referralData = await enhancedReferral.getOrCreateReferralCode(user.id);

    return NextResponse.json(referralData);
  } catch (error) {
    return handleApiError(error, 'Failed to get referral code');
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, referralCode, planValue } = body;

    if (action === 'signup' && referralCode) {
      const result = await enhancedReferral.processReferralSignup(user.id, referralCode);
      return NextResponse.json(result);
    }

    if (action === 'conversion' && planValue) {
      await enhancedReferral.processReferralConversion(user.id, planValue);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return handleApiError(error, 'Failed to process referral');
  }
}

export const dynamic = "force-dynamic";
