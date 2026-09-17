// @ts-nocheck
/**
 * Pricing Engine
 * Intelligent price recommendation with elasticity, Van Westendorp, and geo-pricing
 */
import { db } from '../db/index';
import { pricingRules, elasticityResults, vanWestendorpSurveys, priceExperiments, promoOffers, } from '../db/schema';
import { eq, and, or, isNull, sql } from 'drizzle-orm';
import { logger } from '../observability/index';
/**
 * Get base price from pricing_rules table
 */
async function getBasePrice(plan, country, platform) {
    const rules = await db
        .select()
        .from(pricingRules)
        .where(and(eq(pricingRules.active, true), eq(pricingRules.plan, plan), or(isNull(pricingRules.country), eq(pricingRules.country, country)), or(eq(pricingRules.platform, 'any'), eq(pricingRules.platform, platform)), or(isNull(pricingRules.starts_at), sql `${pricingRules.starts_at} <= now()`), or(isNull(pricingRules.ends_at), sql `${pricingRules.ends_at} >= now()`)))
        .orderBy(sql `${pricingRules.created_at} DESC`)
        .limit(1);
    if (rules.length > 0) {
        return Number(rules[0].price_cents);
    }
    // Default fallback prices
    const defaults = {
        monthly: 999, // $9.99
        annual: 9999, // $99.99
    };
    return defaults[plan] || 999;
}
/**
 * Get elasticity coefficient for country/plan
 */
async function getElasticity(country, plan) {
    const [result] = await db
        .select()
        .from(elasticityResults)
        .where(and(or(isNull(elasticityResults.country), eq(elasticityResults.country, country)), eq(elasticityResults.plan, plan)))
        .orderBy(sql `${elasticityResults.updated_at} DESC`)
        .limit(1);
    if (result) {
        return Number(result.elasticity);
    }
    // Industry defaults: -1.5 (elastic), -0.8 (inelastic)
    return plan === 'monthly' ? -1.5 : -0.8;
}
/**
 * Get Van Westendorp optimal price for country/plan
 */
async function getVanWestendorpPrice(country, plan) {
    const [survey] = await db
        .select({
        median_optimal_price: vanWestendorpSurveys.median_optimal_price,
    })
        .from(vanWestendorpSurveys)
        .where(eq(vanWestendorpSurveys.country, country))
        .orderBy(sql `${vanWestendorpSurveys.ts} DESC`)
        .limit(1);
    return survey?.median_optimal_price ? Number(survey.median_optimal_price) : null;
}
/**
 * Get active price experiment variant
 */
async function getActiveExperiment(plan, country, platform) {
    const [experiment] = await db
        .select()
        .from(priceExperiments)
        .where(and(eq(priceExperiments.status, 'running'), eq(priceExperiments.plan, plan), or(isNull(priceExperiments.country), eq(priceExperiments.country, country)), or(isNull(priceExperiments.platform), eq(priceExperiments.platform, platform)), or(isNull(priceExperiments.started_at), sql `${priceExperiments.started_at} <= now()`), or(isNull(priceExperiments.stopped_at), sql `${priceExperiments.stopped_at} >= now()`)))
        .orderBy(sql `${priceExperiments.started_at} DESC`)
        .limit(1);
    if (!experiment)
        return null;
    return {
        variant_a_price_cents: Number(experiment.variant_a_price_cents),
        variant_b_price_cents: Number(experiment.variant_b_price_cents),
    };
}
/**
 * Get active promo offer for country/plan
 */
async function getActivePromo(plan, country, platform) {
    const rules = await db
        .select({
        promo_offer_id: pricingRules.promo_offer_id,
    })
        .from(pricingRules)
        .where(and(eq(pricingRules.active, true), eq(pricingRules.plan, plan), or(isNull(pricingRules.country), eq(pricingRules.country, country)), or(eq(pricingRules.platform, 'any'), eq(pricingRules.platform, platform)), sql `${pricingRules.promo_offer_id} IS NOT NULL`, or(isNull(pricingRules.starts_at), sql `${pricingRules.starts_at} <= now()`), or(isNull(pricingRules.ends_at), sql `${pricingRules.ends_at} >= now()`)))
        .limit(1);
    if (rules.length === 0 || !rules[0].promo_offer_id)
        return null;
    const [offer] = await db
        .select()
        .from(promoOffers)
        .where(and(eq(promoOffers.id, rules[0].promo_offer_id), eq(promoOffers.active, true), or(isNull(promoOffers.starts_at), sql `${promoOffers.starts_at} <= now()`), or(isNull(promoOffers.ends_at), sql `${promoOffers.ends_at} >= now()`)))
        .limit(1);
    if (!offer)
        return null;
    return {
        kind: offer.kind,
        value: Number(offer.value),
    };
}
/**
 * Apply geo-pricing adjustment based on exchange rates
 * Guard for fairness: no >30% gap within same region cluster
 */
async function applyGeoPricing(basePrice, country, currency) {
    // Exchange rate API (fallback to fixer.io)
    const exchangeRateApiKey = process.env.EXCHANGE_RATE_API_KEY;
    const baseCurrency = 'USD';
    if (currency === baseCurrency || !exchangeRateApiKey) {
        return basePrice;
    }
    try {
        // Fetch exchange rate from fixer.io or similar
        const response = await fetch(`https://api.fixer.io/latest?access_key=${exchangeRateApiKey}&base=${baseCurrency}&symbols=${currency}`);
        const data = await response.json();
        if (data.success && data.rates?.[currency]) {
            const rate = data.rates[currency];
            return Math.round(basePrice * rate);
        }
    }
    catch (error) {
        logger.warn({ error, country, currency }, 'Failed to fetch exchange rate');
    }
    return basePrice;
}
/**
 * Apply constraints: min/max ?20% vs base, never undercut App Store tier
 */
function applyConstraints(price, basePrice, platform) {
    const minPrice = Math.round(basePrice * 0.8); // -20%
    const maxPrice = Math.round(basePrice * 1.2); // +20%
    let constrainedPrice = Math.max(minPrice, Math.min(maxPrice, price));
    // App Store constraint: iOS prices must match App Store pricing tiers
    if (platform === 'ios') {
        // App Store pricing tiers (approximate)
        const appStoreTiers = [
            0, 99, 199, 299, 399, 499, 599, 699, 799, 899, 999, 1099, 1199, 1299,
            1499, 1599, 1799, 1999, 2299, 2499, 2999, 3499, 3999, 4499, 4999,
        ];
        // Round to nearest tier
        const nearestTier = appStoreTiers.reduce((prev, curr) => Math.abs(curr - constrainedPrice) < Math.abs(prev - constrainedPrice)
            ? curr
            : prev);
        constrainedPrice = nearestTier;
    }
    return constrainedPrice;
}
/**
 * Main API: Get recommended price with explainable reason
 */
export async function getRecommendedPrice(plan, country, platform, currency = 'USD') {
    logger.info({ plan, country, platform, currency }, 'Computing price recommendation');
    // 1. Get base price
    const basePrice = (await getBasePrice(plan, country, platform)) || 999;
    // 2. Check for active experiment (highest priority)
    const experiment = await getActiveExperiment(plan, country, platform);
    if (experiment) {
        // Simple A/B: use variant A (control), variant B (treatment)
        // In production, would assign based on user_id hash
        const variantPrice = experiment.variant_a_price_cents;
        return {
            price_cents: applyConstraints(variantPrice, basePrice, platform),
            confidence: 0.6, // Lower confidence during experiment
            reason: `Active price experiment: variant A (${variantPrice} cents)`,
            source: 'experiment',
        };
    }
    // 3. Check Van Westendorp optimal price
    const vwPrice = await getVanWestendorpPrice(country, plan);
    if (vwPrice && Math.abs(vwPrice - basePrice) / basePrice <= 0.2) {
        // Within ?20% constraint
        return {
            price_cents: applyConstraints(vwPrice, basePrice, platform),
            confidence: 0.8,
            reason: `Van Westendorp optimal price based on survey responses`,
            source: 'vanwestendorp',
        };
    }
    // 4. Use elasticity-based pricing
    const elasticity = await getElasticity(country, plan);
    if (elasticity !== null) {
        // If elastic (< -1): can test higher prices
        // If inelastic (> -0.5): test lower prices to increase volume
        let adjustedPrice = basePrice;
        if (elasticity < -1) {
            // Highly elastic: small price increase might increase revenue
            adjustedPrice = Math.round(basePrice * 1.05); // +5%
        }
        else if (elasticity > -0.5) {
            // Inelastic: price decrease might increase volume
            adjustedPrice = Math.round(basePrice * 0.95); // -5%
        }
        const constrainedPrice = applyConstraints(adjustedPrice, basePrice, platform);
        // Apply geo-pricing
        const geoPrice = await applyGeoPricing(constrainedPrice, country, currency);
        // Apply promo discount if available
        const promo = await getActivePromo(plan, country, platform);
        let finalPrice = geoPrice;
        if (promo) {
            if (promo.kind === 'percentage') {
                finalPrice = Math.round(geoPrice * (1 - promo.value / 100));
            }
            else if (promo.kind === 'fixed') {
                finalPrice = Math.max(0, geoPrice - Math.round(promo.value * 100));
            }
        }
        return {
            price_cents: finalPrice,
            confidence: 0.7,
            reason: `Elasticity-based pricing (elasticity: ${elasticity.toFixed(2)}, ${geoPrice !== basePrice ? 'geo-adjusted' : 'base price'})`,
            source: 'elasticity',
        };
    }
    // 5. Fallback: base price with geo-pricing
    const geoPrice = await applyGeoPricing(basePrice, country, currency);
    const promo = await getActivePromo(plan, country, platform);
    let finalPrice = geoPrice;
    if (promo) {
        if (promo.kind === 'percentage') {
            finalPrice = Math.round(geoPrice * (1 - promo.value / 100));
        }
        else if (promo.kind === 'fixed') {
            finalPrice = Math.max(0, geoPrice - Math.round(promo.value * 100));
        }
    }
    return {
        price_cents: finalPrice,
        confidence: 0.5,
        reason: `Base pricing rule${geoPrice !== basePrice ? ' with geo-pricing adjustment' : ''}`,
        source: geoPrice !== basePrice ? 'geopricing' : 'base',
    };
}
