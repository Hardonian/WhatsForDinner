// @ts-nocheck
/**
 * Price Rollout Job
 * Activates scheduled pricing rules and expires promos
 */
import { db } from '../db/index';
import { pricingRules, promoOffers } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '../observability/index';
export async function priceRolloutProcessor() {
    logger.info('Starting price rollout job');
    const results = { activated: 0, expired: 0, errors: 0 };
    try {
        const now = new Date();
        // Activate pricing rules that should start
        const rulesToActivate = await db
            .select()
            .from(pricingRules)
            .where(and(eq(pricingRules.active, false), sql `${pricingRules.starts_at} <= ${now}`, sql `${pricingRules.starts_at} IS NOT NULL`));
        for (const rule of rulesToActivate) {
            try {
                await db
                    .update(pricingRules)
                    .set({ active: true, updated_at: now })
                    .where(eq(pricingRules.id, rule.id));
                results.activated++;
                logger.info({ ruleId: rule.id }, 'Pricing rule activated');
            }
            catch (error) {
                results.errors++;
                logger.error({ error, ruleId: rule.id }, 'Error activating pricing rule');
            }
        }
        // Expire pricing rules that should end
        const rulesToExpire = await db
            .select()
            .from(pricingRules)
            .where(and(eq(pricingRules.active, true), sql `${pricingRules.ends_at} < ${now}`, sql `${pricingRules.ends_at} IS NOT NULL`));
        for (const rule of rulesToExpire) {
            try {
                await db
                    .update(pricingRules)
                    .set({ active: false, updated_at: now })
                    .where(eq(pricingRules.id, rule.id));
                results.expired++;
                logger.info({ ruleId: rule.id }, 'Pricing rule expired');
            }
            catch (error) {
                results.errors++;
                logger.error({ error, ruleId: rule.id }, 'Error expiring pricing rule');
            }
        }
        // Expire promo offers
        const offersToExpire = await db
            .select()
            .from(promoOffers)
            .where(and(eq(promoOffers.active, true), sql `${promoOffers.ends_at} < ${now}`, sql `${promoOffers.ends_at} IS NOT NULL`));
        for (const offer of offersToExpire) {
            try {
                await db
                    .update(promoOffers)
                    .set({ active: false, updated_at: now })
                    .where(eq(promoOffers.id, offer.id));
                results.expired++;
                logger.info({ offerId: offer.id }, 'Promo offer expired');
            }
            catch (error) {
                results.errors++;
                logger.error({ error, offerId: offer.id }, 'Error expiring promo offer');
            }
        }
    }
    catch (error) {
        logger.error({ error }, 'Error in price rollout');
        results.errors++;
    }
    logger.info({ activated: results.activated, expired: results.expired, errors: results.errors }, 'Price rollout completed');
    return results;
}
