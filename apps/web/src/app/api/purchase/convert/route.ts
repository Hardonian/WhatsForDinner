import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, userId } = await request.json();

    // Check if monetization is enabled
    const supabase = createClient();
    const { data: settings } = await supabase
      .from('monetization_settings')
      .select('affiliate_enabled')
      .eq('id', 'main')
      .single();

    if (!settings?.affiliate_enabled) {
      return NextResponse.json({ success: true, message: 'Affiliate not enabled' });
    }

    // Automatically trigger affiliate conversion
    const conversionResponse = await fetch(`${request.nextUrl.origin}/api/affiliate/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount, userId }),
    });

    const conversionData = await conversionResponse.json();

    return NextResponse.json({
      success: true,
      purchase: { orderId, amount },
      affiliate: conversionData.success ? {
        converted: true,
        commission: conversionData.commission,
      } : { converted: false },
    });
  } catch (error) {
    logger.error('Purchase conversion error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to process conversion' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
