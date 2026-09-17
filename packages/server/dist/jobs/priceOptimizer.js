// @ts-nocheck
/**
 * Price Optimizer Job
 * Automated price testing based on elasticity
 * If elasticity < -1 ? test +5% price
 * If elasticity > -0.5 ? test -5% price
 * Auto-pause if conversion drop > 10% or revenue drop > 5%
 */
import { db } from '../db/index';
import { priceExperiments, elasticityResults, transactions, lifecycleEvents, } from '../db/schema';
import { eq, and, sql, gte, lte, count, sum } from 'drizzle-orm';
import { logger } from '../observability/index';
/**
 * Check if experiment should be auto-paused based on conversion/revenue drop
 */
async function shouldPauseExperiment(experimentSlug) {
    const [experiment] = await db
        .select()
        .from(priceExperiments)
        .where(and(eq(priceExperiments.slug, experimentSlug), eq(priceExperiments.status, 'running')))
        .limit(1);
    if (!experiment || !experiment.started_at)
        return false;
    const startedAt = new Date(experiment.started_at);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    // Need at least 1 week of data
    if (startedAt > oneWeekAgo)
        return false;
    // Get baseline metrics (1 week before experiment)
    const baselineStart = new Date(startedAt);
    baselineStart.setDate(baselineStart.getDate() - 7);
    const baselineEnd = new Date(startedAt);
    const baselineConversions = await db
        .select({
        count: count(),
    })
        .from(lifecycleEvents)
        .where(and(eq(lifecycleEvents.name, 'PaywallCTA'), gte(lifecycleEvents.ts, baselineStart), lte(lifecycleEvents.ts, baselineEnd)))
        .limit(1);
    const baselineRevenue = await db
        .select({
        total: sum(transactions.amount_cents),
    })
        .from(transactions)
        .where(and(eq(transactions.status, 'success'), gte(transactions.ts, baselineStart), lte(transactions.ts, baselineEnd)))
        .limit(1);
    // Get experiment metrics (last week)
    const experimentConversions = await db
        .select({
        count: count(),
    })
        .from(lifecycleEvents)
        .where(and(eq(lifecycleEvents.name, 'PaywallCTA'), gte(lifecycleEvents.ts, oneWeekAgo)))
        .limit(1);
    const experimentRevenue = await db
        .select({
        total: sum(transactions.amount_cents),
    })
        .from(transactions)
        .where(and(eq(transactions.status, 'success'), gte(transactions.ts, oneWeekAgo)))
        .limit(1);
    const baselineConv = Number(baselineConversions[0]?.count || 0);
    const expConv = Number(experimentConversions[0]?.count || 0);
    const baselineRev = Number(baselineRevenue[0]?.total || 0);
    const expRev = Number(experimentRevenue[0]?.total || 0);
    // Check conversion drop > 10%
    if (baselineConv > 0) {
        const convDrop = (baselineConv - expConv) / baselineConv;
        if (convDrop > 0.1) {
            logger.warn({ experimentSlug, convDrop }, 'Conversion drop detected, should pause');
            return true;
        }
    }
    // Check revenue drop > 5%
    if (baselineRev > 0) {
        const revDrop = (baselineRev - expRev) / baselineRev;
        if (revDrop > 0.05) {
            logger.warn({ experimentSlug, revDrop }, 'Revenue drop detected, should pause');
            return true;
        }
    }
    return false;
}
/**
 * Automated price optimization loop
 */
export async function optimizePrices() {
    logger.info('Starting automated price optimization');
    try {
        // Get all country/plan combinations with elasticity data
        const elasticityData = await db.select().from(elasticityResults);
        for (const data of elasticityData) {
            const country = data.country;
            const plan = data.plan;
            const elasticity = Number(data.elasticity);
            // Check if experiment already running
            const existingExperiment = await db
                .select()
                .from(priceExperiments)
                .where(and(eq(priceExperiments.status, 'running'), eq(priceExperiments.plan, plan), country
                ? eq(priceExperiments.country, country)
                : sql `${priceExperiments.country} IS NULL`))
                .limit(1);
            if (existingExperiment.length > 0) {
                // Check if should pause
                const shouldPause = await shouldPauseExperiment(existingExperiment[0].slug);
                if (shouldPause) {
                    await db
                        .update(priceExperiments)
                        .set({
                        status: 'paused',
                        stopped_at: new Date(),
                        updated_at: new Date(),
                    })
                        .where(eq(priceExperiments.id, existingExperiment[0].id));
                    logger.info({ slug: existingExperiment[0].slug }, 'Auto-paused price experiment due to performance drop');
                }
                continue;
            }
            // Get current base price from pricing_rules
            const [pricingRule] = await db
                .select()
                .from(pricingRules)
                .where(and(eq(pricingRules.active, true), eq(pricingRules.plan, plan), country
                ? eq(pricingRules.country, country)
                : sql `${pricingRules.country} IS NULL`))
                .orderBy(sql `${pricingRules.created_at} DESC`)
                .limit(1);
            if (!pricingRule)
                continue;
            const basePrice = Number(pricingRule.price_cents);
            let variantA = basePrice;
            let variantB = basePrice;
            // Determine test direction based on elasticity
            if (elasticity < -1) {
                // Highly elastic: test higher price (+5%)
                variantA = basePrice; // Control
                variantB = Math.round(basePrice * 1.05); // Treatment: +5%
            }
            else if (elasticity > -0.5) {
                // Inelastic: test lower price (-5%)
                variantA = basePrice; // Control
                variantB = Math.round(basePrice * 0.95); // Treatment: -5%
            }
            else {
                // Elasticity in middle range: no optimization needed
                continue;
            }
            // Create experiment
            const slug = `auto_${country || 'global'}_${plan}_${Date.now()}`;
            await db.insert(priceExperiments).values({
                slug,
                plan,
                country: country || null,
                platform: null,
                variant_a_price_cents: variantA,
                variant_b_price_cents: variantB,
                status: 'running',
                started_at: new Date(),
            });
            logger.info({ slug, country, plan, variantA, variantB, elasticity }, 'Created automated price experiment');
        }
        logger.info('Price optimization completed');
    }
    catch (error) {
        logger.error({ error }, 'Error in price optimization');
        throw error;
    }
}
