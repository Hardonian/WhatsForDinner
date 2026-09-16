import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { orderId, amount, userId } = await request.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    // Get affiliate code from cookie or database
    const affiliateCode = request.cookies.get('affiliate_code')?.value;
    
    if (!affiliateCode) {
      // Check if user was referred
      const { data: referral } = await supabase
        .from('affiliate_clicks')
        .select('affiliate_id, affiliates!inner(commission_rate)')
        .eq('referral_id', userId)
        .order('clicked_at', { ascending: false })
        .limit(1)
        .single();

      if (!referral) {
        return NextResponse.json({ success: false, message: 'No affiliate found' });
      }

      // Create conversion
      const commissionRate = referral.affiliates.commission_rate;
      const commission = amount * (commissionRate / 100);

      const { data: conversion, error } = await supabase
        .from('affiliate_conversions')
        .insert({
          affiliate_id: referral.affiliate_id,
          referral_id: userId,
          order_id: orderId,
          amount,
          commission_rate: commissionRate,
          commission,
          status: 'pending',
          converted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create commission record
      await supabase.from('affiliate_commissions').insert({
        affiliate_id: referral.affiliate_id,
        conversion_id: conversion.id,
        amount: commission,
        status: 'pending',
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        conversion,
        commission,
      });
    }

    // Get affiliate from code
    const { data: affiliate } = await supabase
      .from('affiliates')
      .select('id, commission_rate')
      .eq('affiliate_code', affiliateCode)
      .single();

    if (!affiliate) {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 404 });
    }

    const commission = amount * (affiliate.commission_rate / 100);

    // Create conversion
    const { data: conversion, error } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_id: affiliate.id,
        referral_id: userId,
        order_id: orderId,
        amount,
        commission_rate: affiliate.commission_rate,
        commission,
        status: 'pending',
        converted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Create commission record
    await supabase.from('affiliate_commissions').insert({
      affiliate_id: affiliate.id,
      conversion_id: conversion.id,
      amount: commission,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      conversion,
      commission,
    });
  } catch (error) {
    logger.error('Affiliate conversion error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { error: 'Failed to process conversion' },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
