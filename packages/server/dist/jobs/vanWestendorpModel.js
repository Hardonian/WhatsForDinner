// @ts-nocheck
/**
 * Van Westendorp Model Job
 * Aggregate survey responses and compute median optimal price per country/plan
 * Update pricing_rules with optimal prices
 */
import { db } from '../db/index';
import { vanWestendorpSurveys, pricingRules } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../observability/index';
/**
 * Compute median optimal price from survey responses
 * Uses Van Westendorp Price Sensitivity Meter methodology
 */
function computeOptimalPrice(responses) {
    if (responses.length === 0)
        return null;
    // Extract price points
    const tooCheapPrices = responses.map((r) => r.too_cheap).sort((a, b) => a - b);
    const cheapPrices = responses.map((r) => r.cheap).sort((a, b) => a - b);
    const expensivePrices = responses.map((r) => r.expensive).sort((a, b) => a - b);
    const tooExpensivePrices = responses.map((r) => r.too_expensive).sort((a, b) => a - b);
    // Compute median for each category
    const medianTooCheap = tooCheapPrices[Math.floor(tooCheapPrices.length / 2)];
    const medianCheap = cheapPrices[Math.floor(cheapPrices.length / 2)];
    const medianExpensive = expensivePrices[Math.floor(expensivePrices.length / 2)];
    const medianTooExpensive = tooExpensivePrices[Math.floor(tooExpensivePrices.length / 2)];
    // Optimal price is intersection of "cheap" and "expensive" curves
    // Simplified: median of median cheap and median expensive
    const optimalPrice = Math.round((medianCheap + medianExpensive) / 2);
    // Point of marginal cheapness (PMC): intersection of too_cheap and cheap
    const pmc = Math.round((medianTooCheap + medianCheap) / 2);
    // Point of marginal expensiveness (PME): intersection of expensive and too_expensive
    const pme = Math.round((medianExpensive + medianTooExpensive) / 2);
    // Acceptable price range: PMC to PME
    const acceptableRange = { min: pmc, max: pme };
    logger.info({ optimalPrice, pmc, pme, acceptableRange }, 'Van Westendorp analysis completed');
    return optimalPrice;
}
/**
 * Aggregate survey responses and update pricing rules
 */
export async function updateVanWestendorpPricing() {
    logger.info('Starting Van Westendorp pricing update');
    try {
        // Get distinct country combinations from surveys
        const countries = await db
            .selectDistinct({
            country: vanWestendorpSurveys.country,
        })
            .from(vanWestendorpSurveys);
        for (const { country } of countries) {
            // Aggregate all responses for this country
            const allSurveys = await db
                .select()
                .from(vanWestendorpSurveys)
                .where(eq(vanWestendorpSurveys.country, country));
            if (allSurveys.length === 0)
                continue;
            // Extract all responses
            const allResponses = [];
            for (const survey of allSurveys) {
                if (survey.responses && Array.isArray(survey.responses)) {
                    allResponses.push(...survey.responses);
                }
            }
            if (allResponses.length === 0)
                continue;
            // Compute optimal price
            const optimalPrice = computeOptimalPrice(allResponses);
            if (!optimalPrice)
                continue;
            // Update pricing rules for monthly and annual plans
            for (const plan of ['monthly', 'annual']) {
                // Check if rule exists for this country/plan
                const [existingRule] = await db
                    .select()
                    .from(pricingRules)
                    .where(and(eq(pricingRules.country, country), eq(pricingRules.plan, plan)))
                    .limit(1);
                if (existingRule) {
                    // Update existing rule
                    await db
                        .update(pricingRules)
                        .set({
                        price_cents: plan === 'annual' ? optimalPrice * 12 : optimalPrice,
                        updated_at: new Date(),
                    })
                        .where(eq(pricingRules.id, existingRule.id));
                }
                else {
                    // Create new rule
                    await db.insert(pricingRules).values({
                        country,
                        plan,
                        platform: 'any',
                        price_cents: plan === 'annual' ? optimalPrice * 12 : optimalPrice,
                        currency: allSurveys[0]?.currency || 'USD',
                        active: true,
                    });
                }
            }
            logger.info({ country, optimalPrice }, 'Van Westendorp pricing updated');
        }
        logger.info('Van Westendorp pricing update completed');
    }
    catch (error) {
        logger.error({ error }, 'Error updating Van Westendorp pricing');
        throw error;
    }
}
