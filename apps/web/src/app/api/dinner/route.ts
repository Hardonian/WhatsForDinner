import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { GenerateRecipesRequestSchema } from '@/lib/validation';
import { generateRecipesWithFallback } from '@/lib/openaiService';
import { aiOptimization } from '@/lib/aiOptimization';
import { StripeService } from '@/lib/stripe';
import { withRateLimit } from '@/lib/rate-limiting';
import { getTenantContext } from '@/lib/auth-middleware';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { analytics } from '@/lib/analytics';
import { suggestionCache } from '@/lib/cache';
import { createComponentLogger } from '@whats-for-dinner/utils';
import { handleApiError } from '@whats-for-dinner/utils';
import { monitorQuery } from '@/lib/performance/query-optimizer';

const _logger = createComponentLogger('dinner-api');

async function handler(req: NextRequest) {
  try {
    // Authenticate and get tenant context (validates user access)
    const tenantResult = await getTenantContext(req);
    if (!tenantResult.success) {
      return tenantResult.response;
    }

    const { context, tenantId } = tenantResult;
    const { supabase } = context;

    // Validate request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate ingredients array
    if (!body.ingredients || !Array.isArray(body.ingredients)) {
      return NextResponse.json(
        { error: 'Ingredients must be an array' },
        { status: 400 }
      );
    }

    // Handle empty pantry
    if (body.ingredients.length === 0) {
      return NextResponse.json(
        {
          error: 'Empty pantry',
          message: 'Please add at least one ingredient to your pantry before generating suggestions.',
          suggestions: [
            'Add common ingredients like chicken, rice, tomatoes',
            'Try the quick entry page at /surprise-me',
            'Visit /pantry to manage your ingredients',
          ],
        },
        { status: 400 }
      );
    }

    // Limit ingredients count to prevent abuse
    if (body.ingredients.length > 50) {
      return NextResponse.json(
        { error: 'Too many ingredients', message: 'Please limit to 50 ingredients or fewer.' },
        { status: 400 }
      );
    }

    const { ingredients, preferences } =
      GenerateRecipesRequestSchema.parse(body);

    // Optimize: Get tenant plan with query monitoring
    const tenantResult_query = await monitorQuery('get-tenant-plan', async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('plan')
        .eq('id', tenantId)
        .single();
      if (error) throw error;
      return data;
    });
    
    const tenant = tenantResult_query.result;

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Check cache first
    const cacheKey = ingredients.sort().join(',') + (preferences || '');
    const cachedResult = suggestionCache.get(ingredients, preferences);
    
    if (cachedResult) {
      // Track cache hit
      await analytics.trackEvent('MEAL_SUGGESTION_GENERATED', {
        suggestion_id: crypto.randomUUID(),
        method: 'ai_generate',
        pantry_items_used: ingredients.length,
        dietary_preferences_applied: preferences ? [preferences] : [],
        generation_time_ms: 0, // Instant from cache
        cached: true,
        user_id: tenantId,
      });

      return NextResponse.json({
        recipes: cachedResult.recipes || [],
        metadata: {
          ...cachedResult.metadata,
          cached: true,
        },
      });
    }

    // Create prompt from ingredients and preferences
    const prompt = `Generate 3 diverse recipes using these ingredients: ${ingredients.join(', ')}. ${preferences ? `Preferences: ${preferences}` : ''}`;

    // Track meal suggestion generation start time
    const startTime = Date.now();

    // Use AI optimization service  
    const result = await aiOptimization.getOptimizedResponse(
      prompt,
      preferences || '',
      tenantId,
      tenant.plan,
      async (model: string) => {
        const recipes = await generateRecipesWithFallback({
          ingredients,
          preferences,
          maxRetries: 3,
          retryDelay: 1000,
        });

        const tokens = Math.ceil(prompt.length / 4); // Rough estimation
        const cost =
          model === 'gpt-4o'
            ? StripeService.calculateTokenCost(tokens, 'gpt-4o')
            : StripeService.calculateTokenCost(tokens, 'gpt-4o-mini');

        return {
          response: recipes,
          tokens,
          cost,
        };
      }
    );

    const responseData = {
      recipes: result.response?.recipes || [],
      metadata: {
        ...result.response?.metadata,
        model: result.model,
        tokensUsed: result.tokens,
        costUsd: result.cost,
        cached: result.cached,
      },
    };

    // Cache the result for future requests
    if (!result.cached && responseData.recipes.length > 0) {
      suggestionCache.set(ingredients, responseData, preferences, 60 * 60 * 1000); // 1 hour TTL
    }

    // Track meal suggestion generated event
    const generationTime = Date.now() - startTime;
    await analytics.trackEvent('MEAL_SUGGESTION_GENERATED', {
      suggestion_id: crypto.randomUUID(),
      method: 'ai_generate',
      pantry_items_used: ingredients.length,
      dietary_preferences_applied: preferences ? [preferences] : [],
      generation_time_ms: generationTime,
      ai_model: result.model,
      tokens_used: result.tokens,
      cost_usd: result.cost,
      cached: result.cached || false,
      user_id: tenantId,
    });

    return NextResponse.json(responseData);
  } catch (error) {
    // Error handled: Error generating recipes:

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    // Handle timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      return NextResponse.json(
        {
          error: 'Request timeout',
          message: 'The request took too long. Please try again with fewer ingredients.',
          retryable: true,
        },
        { status: 504 }
      );
    }

    // Handle network errors
    if (error instanceof Error && (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('ECONNREFUSED')
    )) {
      return NextResponse.json(
        {
          error: 'Network error',
          message: 'Unable to connect to the service. Please check your internet connection and try again.',
          retryable: true,
        },
        { status: 503 }
      );
    }

    // Handle OpenAI API errors
    if (error instanceof Error && error.message.includes('OpenAI')) {
      return NextResponse.json(
        {
          error: 'AI service error',
          message: 'The AI service is temporarily unavailable. Please try again in a few moments.',
          retryable: true,
        },
        { status: 503 }
      );
    }

    // Generic error - use unified error handler
    return handleApiError(error, {
      component: 'dinner-api',
      context: { endpoint: '/api/dinner' },
    });
  }
}

// Apply rate limiting and CSRF protection
export const POST = withRateLimit(
  {
    requests: 20,
    window: 60,
  },
  (req: NextRequest) => withCSRFProtection(handler, req)
);
