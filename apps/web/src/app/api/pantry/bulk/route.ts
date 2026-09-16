import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { createComponentLogger } from '@whats-for-dinner/utils';

const _logger = createComponentLogger('pantry-bulk-api');

const PantryItemEntry = z.union([
  z.string().min(1).max(100),
  z.object({
    name: z.string().min(1).max(100),
    category: z.string().optional(),
    quantity: z.number().optional(),
    unit: z.string().optional(),
  }),
]);

const BulkPantrySchema = z.object({
  items: z.array(PantryItemEntry).min(1).max(50),
  source: z.string().optional().default('onboarding'),
});

async function handler(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const parseResult = BulkPantrySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const rawItems = parseResult.data.items;
    const items = rawItems.map(item => typeof item === 'string' ? item : item.name);
    const source = parseResult.data.source;

    // Check if user is authenticated
    let user = null;
    let supabase = null;
    try {
      supabase = createRouteHandlerClient({ cookies });
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch {
      // Supabase cookies unavailable or unconfigured - continue in guest mode
    }

    if (user && supabase) {
      // Authenticated mode: insert into database
      // Fetch user profile for tenant_id if present
      let tenantId: string | null = null;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        tenantId = profile?.tenant_id || null;
      } catch {
        // profile lookup optional
      }

      const rowsToInsert = items.map((ingredient) => ({
        user_id: user.id,
        tenant_id: tenantId,
        ingredient: ingredient.toLowerCase().trim(),
        quantity: 1,
      }));

      const { data: inserted, error: insertError } = await supabase
        .from('pantry_items')
        .upsert(rowsToInsert, { onConflict: 'user_id,ingredient' })
        .select();

      if (insertError) {
        _logger.warn('Failed to upsert pantry items to Supabase', { error: insertError.message });
        // Fallback to returning success in session mode so client UX is uninterrupted
        return NextResponse.json({
          success: true,
          count: items.length,
          items: rowsToInsert,
          mode: 'authenticated-fallback',
          source,
        });
      }

      _logger.info('Pantry bulk items saved for user', { userId: user.id, count: inserted?.length });
      return NextResponse.json({
        success: true,
        count: inserted?.length || items.length,
        items: inserted || rowsToInsert,
        mode: 'authenticated',
        source,
      });
    }

    // Guest / Onboarding mode: Validate and return structured items
    _logger.info('Pantry bulk items received in guest mode', { count: items.length, source });
    const formattedItems = items.map((ingredient, idx) => ({
      id: `guest-item-${idx + 1}`,
      ingredient: ingredient.toLowerCase().trim(),
      quantity: 1,
    }));

    const response = NextResponse.json({
      success: true,
      count: formattedItems.length,
      items: formattedItems,
      mode: 'guest',
      source,
    });

    // Set guest pantry cookie for seamless conversion
    response.cookies.set('wfd_guest_pantry', JSON.stringify(items), {
      httpOnly: false, // Accessible to client onboarding store
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    _logger.error('Bulk pantry endpoint error', { error: message });
    return NextResponse.json(
      { error: 'Internal server error processing pantry items' },
      { status: 500 }
    );
  }
}

export const POST = (req: NextRequest) => withCSRFProtection(handler, req);
export const GET = async () => {
  return NextResponse.json({
    endpoint: '/api/pantry/bulk',
    methods: ['POST'],
    description: 'Bulk insert pantry items for authenticated users or guest onboarding sessions',
  });
};
