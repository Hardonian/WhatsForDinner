import { z } from 'zod';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['editor', 'viewer']),
});

async function handler(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { email, role } = inviteSchema.parse(body);

    // Check user has family plan
    const { data: user } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (user?.plan !== 'family') {
      return NextResponse.json(
        { error: 'Family plan required' },
        { status: 403 }
      );
    }

    // Generate invite token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    // Create invite
    await supabase.from('family_invites').insert({
      family_owner_id: userId,
      email,
      role,
      token,
      expires_at: expiresAt.toISOString(),
      invited_by: userId,
    });

    // TODO: Send email invitation
    // await sendInviteEmail(email, token);

    return NextResponse.json({
      success: true,
      message: 'Invitation sent',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

export const POST = withTelemetry(handler);

export const dynamic = "force-dynamic";
