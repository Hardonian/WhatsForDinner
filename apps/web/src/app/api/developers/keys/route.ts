import { z } from 'zod';

const CreateAPIKeySchema = z.object({
  name: z.string().min(1).max(100),
});


export async function GET(req: NextRequest) {
  try {
    // Authenticate user via JWT
    const authResult = await requireAuth(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { context } = authResult;
    const { user, supabase } = context;

    // Get API keys for user
    const { data: keys, error } = await supabase
      .from('developer_portal_sessions')
      .select('*')
      .eq('developer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch API keys: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      keys: keys || [],
    });
  } catch (error) {
    // Error handled: Error fetching API keys:
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user via JWT
    const authResult = await requireAuth(req);
    if (!authResult.success) {
      return authResult.response;
    }

    const { context } = authResult;
    const { user, supabase } = context;

    const body = await req.json();
    const { name } = CreateAPIKeySchema.parse(body);

    // Generate API key
    const apiKey = `wfd_${crypto.randomUUID().replace(/-/g, '')}`;

    // Create API key record
    const { data: key, error } = await supabase
      .from('developer_portal_sessions')
      .insert({
        developer_id: user.id,
        api_key: apiKey,
        name: name,
        permissions: ['read:recipes', 'read:pantry', 'write:recipes'],
        rate_limits: {
          requests_per_minute: 100,
          requests_per_hour: 1000,
          requests_per_day: 10000,
        },
        expires_at: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1 year
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      key: key,
    });
  } catch (error) {
    // Error handled: Error creating API key:

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
