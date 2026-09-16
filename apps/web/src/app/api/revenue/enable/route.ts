import { handleError } from '@/lib/errors';

async function handler(req: NextRequest) {
  try {
    if (req.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'owner' && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const channels = body.channels || ['affiliate', 'api', 'data', 'marketplace', 'upsells'];

    // Enable monetization settings
    const settings = {
      id: 'default',
      affiliate_enabled: channels.includes('affiliate'),
      affiliate_commission_rate: 10,
      api_monetization_enabled: channels.includes('api'),
      data_insights_enabled: channels.includes('data'),
      marketplace_enabled: channels.includes('marketplace'),
      marketplace_commission_rate: 10,
      automated_upsells_enabled: channels.includes('upsells'),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('monetization_settings')
      .upsert(settings, { onConflict: 'id' });

    if (error) {
      // If table doesn't exist, try to create it
      if (error.code === '42P01') {
        logger.warn('monetization_settings table does not exist. Run migrations first.');
        return NextResponse.json({
          success: false,
          error: 'Monetization settings table not found. Please run database migrations first.',
          message: 'Run: pnpm db:migrate:monetization',
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'All monetization channels enabled',
      channels: {
        affiliate: channels.includes('affiliate'),
        api: channels.includes('api'),
        data: channels.includes('data'),
        marketplace: channels.includes('marketplace'),
        upsells: channels.includes('upsells'),
      },
    });
  } catch (error) {
    const appError = handleError(error);
    return NextResponse.json(
      { success: false, error: appError.message },
      { status: 500 }
    );
  }
}

export const POST = handler;

export const dynamic = "force-dynamic";
