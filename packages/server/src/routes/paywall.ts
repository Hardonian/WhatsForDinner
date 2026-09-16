// @ts-nocheck
/**
 * Paywall API Route
 * Server-driven paywall configuration with A/B testing
 * Returns pricing, active offers, and variant assignment
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '../auth/index';
import { db } from '../db/index';
import { pricingRules, promoOffers, experiments, experimentVariants } from '../db/schema';
import { eq, and, or, sql, isNull, isNotNull } from 'drizzle-orm';
import { addSecurityHeaders, setCORSHeaders } from '../security/helmet';
import { logger } from '../observability/index';
import { assignExperiment } from '../experiments/service';
import { lifecycleEvents } from '../db/schema';

/**
 * GET /api/paywall/config
 * Get paywall configuration with pricing, offers, and variant
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    const { searchParams } = new URL(request.url);

    const platform = searchParams.get('platform') || 'web'; // ios, android, web
    const country = searchParams.get('country') || 'US';
    const plan = searchParams.get('plan') || 'monthly'; // monthly, annual

    // Get subject ID for experiment assignment
    const subjectId = ctx?.user?.id || searchParams.get('anon_id') || null;
    const experimentOverride = request.headers.get('X-Experiment-Override');

    // Assign paywall experiment variant
    const experimentKey = 'exp_paywall_2025q4';
    let variantKey = 'control';
    let variantMeta: Record<string, unknown> = {};

    if (subjectId) {
      const overrides = experimentOverride
        ? Object.fromEntries(
            experimentOverride.split(',').map((s) => {
              const [key, val] = s.split('=');
              return [key.trim(), val.trim()];
            }),
          )
        : undefined;

      const assignment = await assignExperiment(experimentKey, subjectId, overrides?.[experimentKey]);
      if (assignment) {
        variantKey = assignment.variantKey;
        variantMeta = assignment.meta || {};
      }
    }

    // Get active pricing rules for platform/country
    const rules = await db
      .select()
      .from(pricingRules)
      .where(
        and(
          eq(pricingRules.active, true),
          or(
            isNull(pricingRules.country),
            eq(pricingRules.country, country),
          ),
          or(
            eq(pricingRules.platform, 'any'),
            eq(pricingRules.platform, platform as any),
          ),
          eq(pricingRules.plan, plan as any),
          or(
            isNull(pricingRules.starts_at),
            sql`${pricingRules.starts_at} <= now()`,
          ),
          or(
            isNull(pricingRules.ends_at),
            sql`${pricingRules.ends_at} >= now()`,
          ),
        ),
      )
      .orderBy(sql`${pricingRules.created_at} DESC`)
      .limit(1);

    let pricing = null;
    let activeOffer = null;

    if (rules.length > 0) {
      const rule = rules[0];
      pricing = {
        price_cents: Number(rule.price_cents),
        currency: rule.currency,
        plan: rule.plan,
      };

      // Get associated promo offer if exists
      if (rule.promo_offer_id) {
        const [offer] = await db
          .select()
          .from(promoOffers)
          .where(
            and(
              eq(promoOffers.id, rule.promo_offer_id),
              eq(promoOffers.active, true),
              or(
                isNull(promoOffers.starts_at),
                sql`${promoOffers.starts_at} <= now()`,
              ),
              or(
                isNull(promoOffers.ends_at),
                sql`${promoOffers.ends_at} >= now()`,
              ),
            ),
          )
          .limit(1);

        if (offer) {
          activeOffer = {
            slug: offer.slug,
            kind: offer.kind,
            value: Number(offer.value),
            duration: offer.duration,
          };
        }
      }
    }

    // Default pricing if no rule found
    if (!pricing) {
      pricing = {
        price_cents: plan === 'annual' ? 9999 : 999, // $99.99 annual, $9.99 monthly
        currency: 'USD',
        plan,
      };
    }

    // Build paywall variant config
    const variantConfigs: Record<string, { type: string; props: Record<string, unknown> }> = {
      control: {
        type: 'value_stack',
        props: {
          headline: 'Unlock Premium Features',
          features: [
            'Unlimited meal plans',
            'AI-powered recipe suggestions',
            'Family sharing',
            'Nutritional tracking',
          ],
          testimonials: true,
        },
      },
      variant_a: {
        type: 'value_stack',
        props: {
          headline: 'Unlock Premium Features',
          features: [
            'Unlimited meal plans',
            'AI-powered recipe suggestions',
            'Family sharing',
            'Nutritional tracking',
          ],
          testimonials: true,
        },
      },
      variant_b: {
        type: 'comparison_table',
        props: {
          headline: 'Choose Your Plan',
          showFreeVsPremium: true,
        },
      },
      variant_c: {
        type: 'countdown_trial',
        props: {
          headline: 'Limited Time: Start Your Free Trial',
          countdownEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          trialDays: 7,
        },
      },
    };

    const config = variantConfigs[variantKey] || variantConfigs.control;

    // Track paywall view
    if (subjectId) {
      await db.insert(lifecycleEvents).values({
        user_id: ctx?.user?.id || null,
        anon_id: subjectId.startsWith('anon_') ? subjectId : null,
        name: 'PaywallViewed',
        props: {
          platform,
          country,
          plan,
          variant: variantKey,
          pricing: pricing.price_cents,
        },
      });
    }

    const response = {
      variant: variantKey,
      config: {
        ...config,
        props: {
          ...config.props,
          ...variantMeta,
        },
      },
      pricing,
      activeOffer,
      experimentKey,
    };

    let res = NextResponse.json(response);
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    logger.error({ error }, 'Error fetching paywall config');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/paywall/impression
 * Track paywall impression (client-side)
 */
export async function POST_IMPRESSION(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    const body = await request.json();
    const { variant, platform, plan } = body;

    const subjectId = ctx?.user?.id || body.anon_id || null;

    await db.insert(lifecycleEvents).values({
      user_id: ctx?.user?.id || null,
      anon_id: subjectId?.startsWith('anon_') ? subjectId : null,
      name: 'PaywallImpression',
      props: {
        variant,
        platform,
        plan,
      },
    });

    let res = NextResponse.json({ tracked: true });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    logger.error({ error }, 'Error tracking paywall impression');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/paywall/cta
 * Track paywall CTA click
 */
export async function POST_CTA(request: NextRequest) {
  try {
    const ctx = await getAuthContext(request);
    const body = await request.json();
    const { variant, cta_type, platform, plan } = body; // cta_type: 'primary', 'secondary', 'trial'

    const subjectId = ctx?.user?.id || body.anon_id || null;

    await db.insert(lifecycleEvents).values({
      user_id: ctx?.user?.id || null,
      anon_id: subjectId?.startsWith('anon_') ? subjectId : null,
      name: 'PaywallCTA',
      props: {
        variant,
        cta_type,
        platform,
        plan,
      },
    });

    let res = NextResponse.json({ tracked: true });
    res = addSecurityHeaders(res);
    return setCORSHeaders(res, request.headers.get('origin'));
  } catch (error) {
    logger.error({ error }, 'Error tracking paywall CTA');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
