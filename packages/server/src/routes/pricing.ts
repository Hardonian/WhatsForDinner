// @ts-nocheck
/**
 * Pricing API Routes
 * GET /api/pricing/current - Get current price recommendation
 * POST /api/pricing/survey - Submit Van Westendorp survey responses
 * GET /api/revenue/summary - Get revenue summary
 * GET /api/elasticity/:country/:plan - Get elasticity coefficients
 * POST /api/experiments/price - Start/stop price experiments
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '../auth/index';
import { db } from '../db/index';
import {
  vanWestendorpSurveys,
  priceExperiments,
  elasticityResults,
} from '../db/schema';
import { eq, and, or, isNull, sql } from 'drizzle-orm';
import { addSecurityHeaders, setCORSHeaders } from '../security/helmet';
import { logger } from '../observability/index';
import { getRecommendedPrice } from '../pricing/engine';
import { getRevenueSummary } from '../analytics/revenue';
import { assignExperiment } from '../experiments/service';

// Validation schemas
const priceCurrentSchema = z.object({
  plan: z.enum(['monthly', 'annual']),
  country: z.string().length(3).optional().default('US'),
  platform: z.enum(['ios', 'android', 'web']).optional().default('web'),
  currency: z.string().length(3).optional().default('USD'),
});

const surveySchema = z.object({
  too_cheap: z.number().min(0),
  cheap: z.number().min(0),
  expensive: z.number().min(0),
  too_expensive: z.number().min(0),
  country: z.string().length(3),
  currency: z.string().length(3).optional().default('USD'),
});

const priceExperimentSchema = z.object({
  slug: z.string().min(1),
  plan: z.enum(['monthly', 'annual']),
  country: z.string().length(3).optional(),
  platform: z.enum(['ios', 'android', 'web']).optional(),
  variant_a_price_cents: z.number().int().positive(),
  variant_b_price_cents: z.number().int().positive(),
  action: z.enum(['start', 'stop']),
});

const revenueSummarySchema = z.object({
  period: z.enum(['month', 'quarter']).optional().default('month'),
});

/**
 * GET /api/pricing/current
 * Returns current price recommendation with reason
 */
export async function GET_CURRENT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = priceCurrentSchema.parse({
      plan: searchParams.get('plan') || 'monthly',
      country: searchParams.get('country') || 'US',
      platform: searchParams.get('platform') || 'web',
      currency: searchParams.get('currency') || 'USD',
    });

    const recommendation = await getRecommendedPrice(
      params.plan,
      params.country,
      params.platform,
      params.currency,
    );

    const response = NextResponse.json(recommendation);
    addSecurityHeaders(response);
    return setCORSHeaders(response, request.headers.get('origin'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error fetching current price');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pricing/survey
 * Accept Van Westendorp survey responses
 */
export async function POST_SURVEY(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    const body = await request.json();
    const data = surveySchema.parse(body);

    // Validate: too_cheap < cheap < expensive < too_expensive
    if (
      !(
        data.too_cheap < data.cheap &&
        data.cheap < data.expensive &&
        data.expensive < data.too_expensive
      )
    ) {
      return NextResponse.json(
        { error: 'Invalid price points: must satisfy too_cheap < cheap < expensive < too_expensive' },
        { status: 400 },
      );
    }

    // Calculate median optimal price (intersection of "cheap" and "expensive" curves)
    // Simplified: median of "cheap" and "expensive"
    const medianOptimalPrice = Math.round((data.cheap + data.expensive) / 2);

    // Store survey response
    await db.insert(vanWestendorpSurveys).values({
      user_id: ctx?.user?.id || null,
      country: data.country,
      responses: [
        {
          too_cheap: data.too_cheap,
          cheap: data.cheap,
          expensive: data.expensive,
          too_expensive: data.too_expensive,
        },
      ],
      median_optimal_price: medianOptimalPrice,
      currency: data.currency || 'USD',
      ts: new Date(),
    });

    // Trigger re-calculation (async)
    // This would trigger the vanWestendorpModel job
    // await triggerVanWestendorpRecalculation(data.country);

    const response = NextResponse.json({
      success: true,
      median_optimal_price: medianOptimalPrice,
      message: 'Survey response recorded',
    });
    addSecurityHeaders(response);
    return setCORSHeaders(response, request.headers.get('origin'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error submitting survey');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/revenue/summary
 * Get aggregated revenue snapshots (MRR, ARR, ARPU, churn)
 */
export async function GET_REVENUE_SUMMARY(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin or premium analytics role
    const isAdmin = ctx.user.role === 'admin' || ctx.user.plan === 'partner';
    const isPremium = ctx.user.plan === 'premium' || ctx.user.plan === 'partner';

    if (!isAdmin && !isPremium) {
      return NextResponse.json({ error: 'Premium plan required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const params = revenueSummarySchema.parse({
      period: searchParams.get('period') || 'month',
    });

    const endDate = new Date();
    const startDate = new Date();

    if (params.period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setMonth(startDate.getMonth() - 3);
    }

    const summary = await getRevenueSummary(startDate, endDate);

    const response = NextResponse.json({
      period: params.period,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      snapshots: summary,
    });
    addSecurityHeaders(response);
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 min cache
    return setCORSHeaders(response, request.headers.get('origin'));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error fetching revenue summary');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/elasticity/:country/:plan
 * Get latest elasticity coefficients
 */
export async function GET_ELASTICITY(request: NextRequest, params: { country: string; plan: string }) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = ctx.user.role === 'admin' || ctx.user.plan === 'partner';
    const isPremium = ctx.user.plan === 'premium' || ctx.user.plan === 'partner';

    if (!isAdmin && !isPremium) {
      return NextResponse.json({ error: 'Premium plan required' }, { status: 403 });
    }

    const [result] = await db
      .select()
      .from(elasticityResults)
      .where(
        and(
          or(isNull(elasticityResults.country), eq(elasticityResults.country, params.country)),
          eq(elasticityResults.plan, params.plan),
        ),
      )
      .orderBy(sql`${elasticityResults.updated_at} DESC`)
      .limit(1);

    if (!result) {
      return NextResponse.json(
        {
          country: params.country,
          plan: params.plan,
          elasticity: null,
          message: 'No elasticity data found. Using industry defaults.',
        },
        { status: 404 },
      );
    }

    const response = NextResponse.json({
      country: result.country,
      plan: result.plan,
      elasticity: Number(result.elasticity),
      price_points: result.price_points,
      demand: result.demand,
      updated_at: result.updated_at,
    });
    addSecurityHeaders(response);
    response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    return setCORSHeaders(response, request.headers.get('origin'));
  } catch (error) {
    logger.error({ error }, 'Error fetching elasticity');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/experiments/price
 * Start or stop price experiments
 */
export async function POST_PRICE_EXPERIMENT(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    if (!ctx?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin only
    const isAdmin = ctx.user.role === 'admin' || ctx.user.plan === 'partner';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const data = priceExperimentSchema.parse(body);

    if (data.action === 'start') {
      // Create or update experiment
      const [existing] = await db
        .select()
        .from(priceExperiments)
        .where(eq(priceExperiments.slug, data.slug))
        .limit(1);

      if (existing) {
        await db
          .update(priceExperiments)
          .set({
            plan: data.plan,
            country: data.country || null,
            platform: data.platform as any || null,
            variant_a_price_cents: data.variant_a_price_cents,
            variant_b_price_cents: data.variant_b_price_cents,
            status: 'running',
            started_at: new Date(),
            stopped_at: null,
            updated_at: new Date(),
          })
          .where(eq(priceExperiments.id, existing.id));
      } else {
        await db.insert(priceExperiments).values({
          slug: data.slug,
          plan: data.plan,
          country: data.country || null,
          platform: data.platform as any || null,
          variant_a_price_cents: data.variant_a_price_cents,
          variant_b_price_cents: data.variant_b_price_cents,
          status: 'running',
          started_at: new Date(),
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Price experiment started',
        slug: data.slug,
      });
    } else {
      // Stop experiment
      const [experiment] = await db
        .select()
        .from(priceExperiments)
        .where(eq(priceExperiments.slug, data.slug))
        .limit(1);

      if (!experiment) {
        return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
      }

      await db
        .update(priceExperiments)
        .set({
          status: 'complete',
          stopped_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(priceExperiments.id, experiment.id));

      return NextResponse.json({
        success: true,
        message: 'Price experiment stopped',
        slug: data.slug,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid parameters', details: error.errors }, { status: 400 });
    }
    logger.error({ error }, 'Error managing price experiment');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
