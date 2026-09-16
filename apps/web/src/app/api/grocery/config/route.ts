import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'owner' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await groceryManager.initialize();
    const config = groceryManager.getConfig();

    // Return config with API key status (without exposing keys)
    const configWithStatus = {
      ...config,
      stores: config.stores.map(store => ({
        ...store,
        apiKey: store.apiKey ? '***configured***' : undefined,
        apiSecret: store.apiSecret ? '***configured***' : undefined,
        enabled: store.enabled,
        connectionStatus: 'unknown', // Would be checked via validateConnection
      })),
    };

    return NextResponse.json({
      success: true,
      data: configWithStatus,
    });
  } catch (error) {
    logger.error('Grocery config API error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to load config' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'owner' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    await groceryManager.updateConfig(body);

    return NextResponse.json({
      success: true,
      message: 'Configuration updated',
    });
  } catch (error) {
    logger.error('Grocery config update error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to update config' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
