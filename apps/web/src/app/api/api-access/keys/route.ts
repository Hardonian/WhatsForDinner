import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId = 'free' } = await request.json();

    // Generate API key
    const apiKey = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Get plan limits
    const { data: plan } = await supabase
      .from('api_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Check if user already has a key
    const { data: existing } = await supabase
      .from('api_keys')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'API key already exists',
        apiKey: '***hidden***', // Don't expose existing key
      });
    }

    // Create API key
    const { data: key, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        plan_id: planId,
        key_hash: keyHash,
        rate_limit: plan.rate_limit,
        monthly_limit: plan.monthly_limit,
        status: 'active',
        created_at: new Date().toISOString(),
        expires_at: planId === 'free' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days for free
          : null, // No expiry for paid plans
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      apiKey, // Only return once - user must save it
      keyId: key.id,
      plan: plan.name,
      limits: {
        rateLimit: plan.rate_limit,
        monthlyLimit: plan.monthly_limit,
      },
      warning: 'Save this API key - it will not be shown again!',
    });
  } catch (error) {
    logger.error('API key creation error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: key } = await supabase
      .from('api_keys')
      .select('id, plan_id, rate_limit, monthly_limit, status, created_at, expires_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!key) {
      return NextResponse.json({ error: 'No API key found' }, { status: 404 });
    }

    // Get usage
    const { data: usage } = await supabase
      .from('api_usage')
      .select('requests_count')
      .eq('key_id', key.id)
      .gte('created_at', new Date(new Date().setDate(1)).toISOString()) // This month
      .single();

    return NextResponse.json({
      key: {
        id: key.id,
        plan: key.plan_id,
        status: key.status,
        createdAt: key.created_at,
        expiresAt: key.expires_at,
      },
      limits: {
        rateLimit: key.rate_limit,
        monthlyLimit: key.monthly_limit,
      },
      usage: {
        requestsThisMonth: usage?.requests_count || 0,
        remaining: key.monthly_limit - (usage?.requests_count || 0),
      },
    });
  } catch (error) {
    logger.error('API key fetch error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to fetch API key' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
