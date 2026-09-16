import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { headers } from 'next/headers';
import { z } from 'zod';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { NextRequest } from 'next/server';
import { handleApiError } from '@whats-for-dinner/utils';
import { createComponentLogger } from '@whats-for-dinner/utils';
import { monitorQuery } from '@/lib/performance/query-optimizer';

const _logger = createComponentLogger('pantry-seed-api');

// Canadian pantry staples - optimized for solo users
const SAMPLE_INGREDIENTS = [
  // Proteins
  'chicken breast',
  'eggs',
  'ground beef',
  'salmon fillet',
  // Grains & Starches
  'rice',
  'pasta',
  'bread',
  'potatoes',
  // Vegetables
  'tomatoes',
  'onions',
  'garlic',
  'bell peppers',
  'carrots',
  'broccoli',
  // Pantry Staples
  'olive oil',
  'cheese',
  'butter',
  'milk',
  'flour',
  'sugar',
  'salt',
  'black pepper',
];

/**
 * POST /api/pantry/seed-sample
 * Seeds sample ingredients into user's pantry
 */
async function handler(req: NextRequest) {
  try {
    const headersList = await headers();
    
    // Get user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Optimize: Check if sample data already seeded and get tenant_id in parallel
    const [existingResult, profileResult] = await Promise.all([
      monitorQuery('check-existing-sample', async () => {
        const { data, error } = await supabase
          .from('pantry_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_sample', true)
          .limit(1);
        if (error) throw error;
        return data;
      }),
      monitorQuery('get-user-profile', async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        return data;
      }),
    ]);

    const existing = existingResult.result;
    const profile = profileResult.result;

    if (existing && existing.length > 0) {
      return NextResponse.json({
        message: 'Sample data already seeded',
        count: existing.length,
      });
    }

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'No tenant found for user' },
        { status: 400 }
      );
    }

    // Insert sample ingredients
    const itemsToInsert = SAMPLE_INGREDIENTS.map(ingredient => ({
      user_id: user.id,
      tenant_id: profile.tenant_id,
      ingredient,
      is_sample: true,
      created_at: new Date().toISOString(),
    }));

    const insertResult = await monitorQuery('insert-sample-ingredients', async () => {
      const { data, error } = await supabase
        .from('pantry_items')
        .insert(itemsToInsert)
        .select();
      if (error) throw error;
      return data;
    });

    const data = insertResult.result;

    // Optimize: Update onboarding state and track event in parallel
    await Promise.all([
      supabase
        .from('onboarding_state')
        .upsert({
          user_id: user.id,
          sample_data_seeded: true,
          pantry_prefilled: true,
          updated_at: new Date().toISOString(),
        }),
      supabase
        .from('events')
        .insert({
          user_id: user.id,
          event_name: 'pantry_prefilled',
          occurred_at: new Date().toISOString(),
          props: {
            ingredient_count: data.length,
            source: 'onboarding',
          },
        }),
    ]);

    return NextResponse.json({
      success: true,
      count: data.length,
      ingredients: SAMPLE_INGREDIENTS,
      message: 'Pantry pre-filled with Canadian staples. Ready to generate your first meal plan!',
      next_step: 'generate_meal_plan',
    });
  } catch (error) {
    _logger.error('Error seeding sample data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return handleApiError(error, {
      component: 'pantry-seed-api',
      context: { endpoint: '/api/pantry/seed-sample' },
    });
  }
}

export const POST = (req: NextRequest) => withCSRFProtection(handler, req);
